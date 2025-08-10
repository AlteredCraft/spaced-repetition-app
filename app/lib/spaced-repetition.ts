import { Flashcard, Difficulty, ReviewResult } from '@/app/types';
import { CardStorage, ProgressStorage, formatDate, getTodayString } from './storage';

/**
 * Spaced Repetition Algorithm based on SM-2
 * 
 * The SM-2 algorithm was developed by Piotr Wozniak and is used in many
 * spaced repetition systems including Anki and SuperMemo.
 * 
 * Key concepts:
 * - Ease Factor (EF): Determines how much the interval increases after each review
 * - Interval: Number of days until the next review
 * - Repetitions: Number of consecutive correct reviews
 */

interface AlgorithmResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export class SpacedRepetitionAlgorithm {
  /**
   * Process a review result and update the card's scheduling parameters
   */
  static processReview(card: Flashcard, difficulty: Difficulty, responseTime: number): Flashcard {
    const result = this.calculateNext(card, difficulty);
    
    // Update card statistics
    const totalReviews = card.totalReviews + 1;
    const correctReviews = difficulty !== Difficulty.AGAIN 
      ? card.correctReviews + 1 
      : card.correctReviews;
    
    const streak = difficulty !== Difficulty.AGAIN 
      ? card.streak + 1 
      : 0;

    // Update average response time
    const averageResponseTime = card.averageResponseTime
      ? (card.averageResponseTime * card.totalReviews + responseTime) / totalReviews
      : responseTime;

    const updatedCard: Flashcard = {
      ...card,
      ...result,
      totalReviews,
      correctReviews,
      streak,
      averageResponseTime,
      updatedAt: new Date(),
    };

    // Save the updated card
    CardStorage.update(card.id, updatedCard);
    
    // Update daily statistics
    this.updateDailyStats(difficulty !== Difficulty.AGAIN, responseTime);
    
    return updatedCard;
  }

  /**
   * Calculate the next review parameters using SM-2 algorithm
   */
  private static calculateNext(card: Flashcard, difficulty: Difficulty): AlgorithmResult {
    let { easeFactor, interval, repetitions } = card;
    const now = new Date();

    switch (difficulty) {
      case Difficulty.AGAIN:
        // Reset the card - show it again in 1 minute for immediate review
        repetitions = 0;
        interval = 0;
        // Don't change ease factor for wrong answers initially
        break;

      case Difficulty.HARD:
        // Reduce ease factor and use shorter interval
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        if (repetitions === 0) {
          repetitions = 1;
          interval = 1; // 1 day
        } else if (repetitions === 1) {
          repetitions = 2;
          interval = 2; // 2 days  
        } else {
          repetitions += 1;
          interval = Math.max(1, Math.round(interval * easeFactor * 0.8)); // 80% of normal interval
        }
        break;

      case Difficulty.GOOD:
        // Standard SM-2 algorithm
        if (repetitions === 0) {
          repetitions = 1;
          interval = 1; // 1 day
        } else if (repetitions === 1) {
          repetitions = 2;
          interval = 6; // 6 days
        } else {
          repetitions += 1;
          interval = Math.round(interval * easeFactor);
        }
        break;

      case Difficulty.EASY:
        // Increase ease factor and use longer interval
        easeFactor = Math.min(2.5, easeFactor + 0.1);
        if (repetitions === 0) {
          repetitions = 1;
          interval = 4; // 4 days (longer than normal first interval)
        } else if (repetitions === 1) {
          repetitions = 2;
          interval = 8; // 8 days (longer than normal second interval)
        } else {
          repetitions += 1;
          interval = Math.round(interval * easeFactor * 1.3); // 130% of normal interval
        }
        break;
    }

    // Calculate next review date
    const nextReviewDate = new Date(now);
    if (difficulty === Difficulty.AGAIN) {
      // Show again in 1 minute for immediate review
      nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 1);
    } else {
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    }

    return {
      easeFactor,
      interval,
      repetitions,
      nextReviewDate,
    };
  }

  /**
   * Get cards that are due for review
   */
  static getDueCards(maxCards?: number): Flashcard[] {
    const allCards = CardStorage.getDueCards();
    const shuffled = this.shuffleArray([...allCards]);
    
    return maxCards ? shuffled.slice(0, maxCards) : shuffled;
  }

  /**
   * Get new cards (cards that haven't been studied yet)
   */
  static getNewCards(maxCards?: number): Flashcard[] {
    const newCards = CardStorage.getNewCards();
    const shuffled = this.shuffleArray([...newCards]);
    
    return maxCards ? shuffled.slice(0, maxCards) : shuffled;
  }

  /**
   * Get a mixed study queue of due cards and new cards
   */
  static getStudyQueue(maxNewCards = 10, maxReviews = 50): Flashcard[] {
    const dueCards = this.getDueCards(maxReviews);
    const newCards = this.getNewCards(maxNewCards);
    
    // Interleave new cards and review cards
    const queue: Flashcard[] = [];
    const maxLength = Math.max(dueCards.length, newCards.length);
    
    for (let i = 0; i < maxLength; i++) {
      // Add 2 review cards for every new card
      if (i < dueCards.length) {
        queue.push(dueCards[i]);
      }
      if (i < dueCards.length && i + 1 < dueCards.length) {
        queue.push(dueCards[i + 1]);
      }
      if (i < newCards.length) {
        queue.push(newCards[i]);
      }
    }
    
    return queue;
  }

  /**
   * Update daily statistics
   */
  private static updateDailyStats(correct: boolean, responseTime: number): void {
    const today = getTodayString();
    const progress = ProgressStorage.get();
    
    const existingStats = progress.dailyStats.find(s => s.date === today);
    if (existingStats) {
      existingStats.cardsStudied += 1;
      if (correct) {
        existingStats.correctAnswers += 1;
      }
      existingStats.studyTime += responseTime;
    } else {
      progress.dailyStats.push({
        date: today,
        cardsStudied: 1,
        correctAnswers: correct ? 1 : 0,
        studyTime: responseTime,
        newCards: 0, // This would be updated elsewhere when tracking new cards
      });
    }
    
    // Update lifetime stats
    progress.lifetimeStats.totalReviews += 1;
    if (correct) {
      progress.lifetimeStats.correctReviews += 1;
    }
    progress.lifetimeStats.accuracy = 
      progress.lifetimeStats.totalReviews > 0 
        ? (progress.lifetimeStats.correctReviews / progress.lifetimeStats.totalReviews) * 100 
        : 0;
    
    ProgressStorage.save(progress);
  }

  /**
   * Calculate the optimal time to show a card again based on performance
   */
  static getOptimalInterval(card: Flashcard): number {
    // This is a simplified version - in practice you might want to
    // consider factors like:
    // - Recent performance on similar cards
    // - Time of day
    // - User's historical accuracy
    // - Card difficulty based on average response time
    
    const baseInterval = card.interval;
    const accuracy = card.totalReviews > 0 ? card.correctReviews / card.totalReviews : 0;
    
    // Adjust interval based on accuracy
    if (accuracy < 0.6) {
      return Math.max(1, Math.round(baseInterval * 0.5)); // Halve the interval
    } else if (accuracy > 0.9) {
      return Math.round(baseInterval * 1.2); // Increase by 20%
    }
    
    return baseInterval;
  }

  /**
   * Predict when a user will forget a card (forgetting curve)
   */
  static getPredictedRetention(card: Flashcard, daysFromNow: number): number {
    // Simplified forgetting curve based on Ebbinghaus
    // R = e^(-t/s) where R is retention, t is time, s is stability
    
    const stability = card.easeFactor * card.interval;
    const retention = Math.exp(-daysFromNow / stability);
    
    return Math.max(0, Math.min(1, retention));
  }

  /**
   * Get statistics about the study queue
   */
  static getQueueStats(): {
    dueCount: number;
    newCount: number;
    totalCards: number;
    averageEaseFactor: number;
  } {
    const allCards = CardStorage.getAll();
    const dueCards = CardStorage.getDueCards();
    const newCards = CardStorage.getNewCards();
    
    const totalEaseFactor = allCards.reduce((sum, card) => sum + card.easeFactor, 0);
    const averageEaseFactor = allCards.length > 0 ? totalEaseFactor / allCards.length : 2.5;
    
    return {
      dueCount: dueCards.length,
      newCount: newCards.length,
      totalCards: allCards.length,
      averageEaseFactor,
    };
  }

  /**
   * Utility function to shuffle an array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Utility functions for working with the algorithm
 */
export class StudyUtils {
  /**
   * Get difficulty level suggestion based on response time and card history
   */
  static suggestDifficulty(card: Flashcard, responseTime: number): Difficulty {
    const averageTime = card.averageResponseTime || 5;
    const accuracy = card.totalReviews > 0 ? card.correctReviews / card.totalReviews : 1;
    
    // Very slow response suggests difficulty
    if (responseTime > averageTime * 2) {
      return Difficulty.HARD;
    }
    
    // Very fast response with high accuracy suggests it's easy
    if (responseTime < averageTime * 0.5 && accuracy > 0.9) {
      return Difficulty.EASY;
    }
    
    // Default to good
    return Difficulty.GOOD;
  }

  /**
   * Format interval for display
   */
  static formatInterval(interval: number): string {
    if (interval < 1) {
      return '< 1 day';
    } else if (interval === 1) {
      return '1 day';
    } else if (interval < 30) {
      return `${interval} days`;
    } else if (interval < 365) {
      const months = Math.round(interval / 30);
      return `${months} month${months === 1 ? '' : 's'}`;
    } else {
      const years = Math.round(interval / 365);
      return `${years} year${years === 1 ? '' : 's'}`;
    }
  }

  /**
   * Calculate study streak
   */
  static calculateStudyStreak(): number {
    const progress = ProgressStorage.get();
    const dailyStats = progress.dailyStats.sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    const today = getTodayString();
    let currentDate = new Date();
    
    for (const stats of dailyStats) {
      const dateStr = formatDate(currentDate);
      
      if (stats.date === dateStr && stats.cardsStudied > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }
}