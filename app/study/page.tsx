"use client";

import { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/app/components/navigation';
import { SpacedRepetitionAlgorithm } from '@/app/lib/spaced-repetition';
import { SettingsStorage, SessionStorage } from '@/app/lib/storage';
import { Flashcard, Difficulty, StudySession, StudySettings } from '@/app/types';

export default function StudyPage() {
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionStats, setSessionStats] = useState({
    studied: 0,
    correct: 0,
    startTime: new Date(),
  });
  const [settings, setSettings] = useState<StudySettings | null>(null);
  const [responseStartTime, setResponseStartTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const userSettings = SettingsStorage.get();
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        // Use default settings if there's an error
        setSettings({
          dailyGoal: 20,
          maxNewCards: 10,
          maxReviews: 50,
          showTimer: true,
          autoAdvance: false,
          shuffleCards: true,
        });
      }
    };

    loadSettings();
  }, []); // Only load settings once

  useEffect(() => {
    const loadStudyQueue = () => {
      if (settings) {
        try {
          const queue = SpacedRepetitionAlgorithm.getStudyQueue(
            settings.maxNewCards,
            settings.maxReviews
          );
          setStudyQueue(settings.shuffleCards ? shuffleArray([...queue]) : queue);
        } catch (error) {
          console.error('Error loading study queue:', error);
          setStudyQueue([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (settings) {
      loadStudyQueue();
    }
  }, [settings]); // Load queue when settings change

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startSession = () => {
    const newSession: Omit<StudySession, 'id'> = {
      startTime: new Date(),
      cardsStudied: 0,
      correctAnswers: 0,
      totalTime: 0,
      averageResponseTime: 0,
    };

    const session = SessionStorage.add(newSession);
    setSessionId(session.id);
    setSessionStarted(true);
    setResponseStartTime(new Date());
    setSessionStats({
      studied: 0,
      correct: 0,
      startTime: new Date(),
    });
  };

  const endSession = () => {
    if (sessionId) {
      const now = new Date();
      const totalTime = (now.getTime() - sessionStats.startTime.getTime()) / 1000;
      const averageResponseTime = sessionStats.studied > 0 ? totalTime / sessionStats.studied : 0;

      SessionStorage.update(sessionId, {
        endTime: now,
        cardsStudied: sessionStats.studied,
        correctAnswers: sessionStats.correct,
        totalTime,
        averageResponseTime,
      });
    }

    setSessionStarted(false);
    setShowAnswer(false);
    setCurrentCardIndex(0);
  };

  const handleDifficultyResponse = useCallback((difficulty: Difficulty) => {
    if (!sessionStarted || currentCardIndex >= studyQueue.length) return;

    const currentCard = studyQueue[currentCardIndex];
    const now = new Date();
    const responseTime = (now.getTime() - responseStartTime.getTime()) / 1000;

    // Update the card using the spaced repetition algorithm
    const updatedCard = SpacedRepetitionAlgorithm.processReview(
      currentCard,
      difficulty,
      responseTime
    );

    // Update session statistics
    const newStats = {
      ...sessionStats,
      studied: sessionStats.studied + 1,
      correct: difficulty !== Difficulty.AGAIN 
        ? sessionStats.correct + 1 
        : sessionStats.correct,
    };
    setSessionStats(newStats);

    // Move to next card or end session
    if (currentCardIndex + 1 >= studyQueue.length) {
      // End session inline
      if (sessionId) {
        const now = new Date();
        const totalTime = (now.getTime() - sessionStats.startTime.getTime()) / 1000;
        const averageResponseTime = newStats.studied > 0 ? totalTime / newStats.studied : 0;

        SessionStorage.update(sessionId, {
          endTime: now,
          cardsStudied: newStats.studied,
          correctAnswers: newStats.correct,
          totalTime,
          averageResponseTime,
        });
      }

      setSessionStarted(false);
      setShowAnswer(false);
      setCurrentCardIndex(0);
    } else {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
      setResponseStartTime(new Date());
    }
  }, [sessionStarted, currentCardIndex, studyQueue, responseStartTime, sessionStats, sessionId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!sessionStarted || currentCardIndex >= studyQueue.length) return;

      if (event.key === ' ' && !showAnswer) {
        event.preventDefault();
        setShowAnswer(true);
      } else if (showAnswer) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleDifficultyResponse(Difficulty.AGAIN);
            break;
          case '2':
            event.preventDefault();
            handleDifficultyResponse(Difficulty.HARD);
            break;
          case '3':
            event.preventDefault();
            handleDifficultyResponse(Difficulty.GOOD);
            break;
          case '4':
            event.preventDefault();
            handleDifficultyResponse(Difficulty.EASY);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sessionStarted, showAnswer, handleDifficultyResponse, currentCardIndex, studyQueue.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading study session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (studyQueue.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">All caught up!</h3>
            <p className="text-muted-foreground mb-6">
              No cards are due for review right now. Great job staying on top of your studies!
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/cards/new'}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors mr-4"
              >
                Add New Cards
              </button>
              <button
                onClick={() => window.location.href = '/cards'}
                className="border border-border text-foreground hover:bg-accent px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Manage Cards
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!sessionStarted) {
    const queueStats = SpacedRepetitionAlgorithm.getQueueStats();
    
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Ready to Study?</h1>
            <p className="text-muted-foreground">
              Let&apos;s review your flashcards and strengthen your memory
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Study Session Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{studyQueue.length}</div>
                <div className="text-sm text-blue-600">Cards to Study</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{queueStats.dueCount}</div>
                <div className="text-sm text-orange-600">Due for Review</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{queueStats.newCount}</div>
                <div className="text-sm text-purple-600">New Cards</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{queueStats.totalCards}</div>
                <div className="text-sm text-green-600">Total Cards</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={startSession}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Study Session
            </button>
            <p className="text-sm text-muted-foreground mt-4">
              Use keyboard shortcuts: Space to reveal answer, 1-4 to rate difficulty
            </p>
          </div>
        </main>
      </div>
    );
  }

  const currentCard = studyQueue[currentCardIndex];
  const progress = ((currentCardIndex) / studyQueue.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Card {currentCardIndex + 1} of {studyQueue.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {sessionStats.studied} studied, {sessionStats.correct} correct
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8 min-h-[400px] flex flex-col justify-center">
          <div className="text-center">
            {/* Front Side */}
            <div className="mb-8">
              <div className="text-sm text-muted-foreground mb-2">Question:</div>
              <div className="text-xl text-foreground leading-relaxed">
                {currentCard.front}
              </div>
            </div>

            {/* Answer Area */}
            {!showAnswer ? (
              <div className="space-y-4">
                <div className="text-muted-foreground">Think about your answer...</div>
                <button
                  onClick={() => setShowAnswer(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Show Answer <span className="text-sm opacity-75">(Space)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-accent/50 rounded-lg border-l-4 border-primary">
                  <div className="text-sm text-muted-foreground mb-2">Answer:</div>
                  <div className="text-lg text-foreground leading-relaxed">
                    {currentCard.back}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">How well did you remember this?</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleDifficultyResponse(Difficulty.AGAIN)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Again <span className="block text-xs opacity-75">(1)</span>
                    </button>
                    <button
                      onClick={() => handleDifficultyResponse(Difficulty.HARD)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Hard <span className="block text-xs opacity-75">(2)</span>
                    </button>
                    <button
                      onClick={() => handleDifficultyResponse(Difficulty.GOOD)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Good <span className="block text-xs opacity-75">(3)</span>
                    </button>
                    <button
                      onClick={() => handleDifficultyResponse(Difficulty.EASY)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Easy <span className="block text-xs opacity-75">(4)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Info */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="space-x-4">
            {currentCard.category && (
              <span>Category: {currentCard.category}</span>
            )}
            <span>Reviews: {currentCard.totalReviews}</span>
            <span>Streak: {currentCard.streak}</span>
          </div>
          <button
            onClick={endSession}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            End Session
          </button>
        </div>
      </main>
    </div>
  );
}