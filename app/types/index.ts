export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Spaced repetition fields
  easeFactor: number; // 1.3 - 2.5+
  interval: number; // days
  repetitions: number;
  nextReviewDate: Date;
  
  // Statistics
  totalReviews: number;
  correctReviews: number;
  streak: number;
  averageResponseTime?: number; // in seconds
}

export interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  cardsStudied: number;
  correctAnswers: number;
  totalTime: number; // in seconds
  averageResponseTime: number;
}

export interface UserProgress {
  totalCards: number;
  cardsLearned: number; // cards with repetitions > 0
  cardsDue: number;
  streakDays: number;
  totalStudyTime: number; // in seconds
  lastStudyDate?: Date;
  
  // Daily statistics
  dailyStats: DailyStats[];
  
  // Lifetime statistics
  lifetimeStats: {
    totalReviews: number;
    correctReviews: number;
    accuracy: number;
    longestStreak: number;
    totalCardsCreated: number;
  };
}

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  cardsStudied: number;
  correctAnswers: number;
  studyTime: number; // in seconds
  newCards: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  cardCount: number;
}

export enum Difficulty {
  AGAIN = 'again',    // < 60% correct, show again soon
  HARD = 'hard',      // 60-80% correct, reduce interval
  GOOD = 'good',      // 80-95% correct, normal interval
  EASY = 'easy',      // 95%+ correct, increase interval more
}

export interface ReviewResult {
  cardId: string;
  difficulty: Difficulty;
  responseTime: number; // in seconds
  timestamp: Date;
}

export interface StudySettings {
  dailyGoal: number; // cards per day
  maxNewCards: number; // new cards per day
  maxReviews: number; // review cards per day
  showTimer: boolean;
  autoAdvance: boolean;
  shuffleCards: boolean;
}

// Local storage keys
export enum StorageKeys {
  CARDS = 'spaced-repetition-cards',
  USER_PROGRESS = 'spaced-repetition-progress',
  STUDY_SESSIONS = 'spaced-repetition-sessions',
  CATEGORIES = 'spaced-repetition-categories',
  SETTINGS = 'spaced-repetition-settings',
}