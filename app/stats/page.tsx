"use client";

import { useState, useEffect } from 'react';
import { Navigation } from '@/app/components/navigation';
import { CardStorage, ProgressStorage, SessionStorage } from '@/app/lib/storage';
import { SpacedRepetitionAlgorithm, StudyUtils } from '@/app/lib/spaced-repetition';
import { Flashcard, StudySession, UserProgress } from '@/app/types';

export default function StatsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setCards(CardStorage.getAll());
      setProgress(ProgressStorage.get());
      setSessions(SessionStorage.getAll());
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  const queueStats = SpacedRepetitionAlgorithm.getQueueStats();
  const studyStreak = StudyUtils.calculateStudyStreak();
  
  // Calculate recent performance
  const recentSessions = sessions.slice(-7); // Last 7 sessions
  const recentPerformance = recentSessions.length > 0
    ? (recentSessions.reduce((sum, s) => sum + s.correctAnswers, 0) / 
       recentSessions.reduce((sum, s) => sum + s.cardsStudied, 0)) * 100
    : 0;

  // Calculate cards by difficulty
  const cardsByDifficulty = cards.reduce((acc, card) => {
    if (card.easeFactor < 2.0) acc.hard++;
    else if (card.easeFactor < 2.3) acc.medium++;
    else acc.easy++;
    return acc;
  }, { easy: 0, medium: 0, hard: 0 });

  // Calculate daily average (last 30 days)
  const last30Days = progress?.dailyStats.slice(-30) || [];
  const dailyAverage = last30Days.length > 0
    ? last30Days.reduce((sum, day) => sum + day.cardsStudied, 0) / last30Days.length
    : 0;

  // Get upcoming reviews (next 7 days)
  const upcomingReviews = cards.filter(card => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return card.nextReviewDate <= nextWeek;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Statistics</h1>
          <p className="text-muted-foreground">
            Track your learning progress and performance
          </p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cards</p>
                <p className="text-2xl font-bold text-foreground">{cards.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due for Review</p>
                <p className="text-2xl font-bold text-orange-600">{queueStats.dueCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold text-green-600">{studyStreak} days</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Performance</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(recentPerformance)}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Learning Progress */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Learning Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cards Learned</span>
                <span className="font-medium">{cards.filter(c => c.repetitions > 0).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Cards</span>
                <span className="font-medium">{queueStats.newCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Ease Factor</span>
                <span className="font-medium">{queueStats.averageEaseFactor.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Daily Average (30d)</span>
                <span className="font-medium">{Math.round(dailyAverage)} cards</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Upcoming Reviews (7d)</span>
                <span className="font-medium">{upcomingReviews}</span>
              </div>
            </div>
          </div>

          {/* Card Difficulty Distribution */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Card Difficulty</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Easy (EF &ge; 2.3)</span>
                </div>
                <span className="font-medium">{cardsByDifficulty.easy}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ 
                    width: cards.length > 0 ? `${(cardsByDifficulty.easy / cards.length) * 100}%` : '0%' 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-muted-foreground">Medium (EF 2.0-2.3)</span>
                </div>
                <span className="font-medium">{cardsByDifficulty.medium}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ 
                    width: cards.length > 0 ? `${(cardsByDifficulty.medium / cards.length) * 100}%` : '0%' 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-muted-foreground">Hard (EF &lt; 2.0)</span>
                </div>
                <span className="font-medium">{cardsByDifficulty.hard}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ 
                    width: cards.length > 0 ? `${(cardsByDifficulty.hard / cards.length) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No study sessions yet</p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(-5).reverse().map((session, index) => (
                  <div key={session.id} className="flex justify-between items-center py-2">
                    <div>
                      <div className="text-sm font-medium">
                        {session.cardsStudied} cards studied
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {session.cardsStudied > 0 ? Math.round((session.correctAnswers / session.cardsStudied) * 100) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(session.totalTime / 60)}min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lifetime Statistics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Lifetime Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Reviews</span>
                <span className="font-medium">{progress?.lifetimeStats.totalReviews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Correct Reviews</span>
                <span className="font-medium">{progress?.lifetimeStats.correctReviews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Overall Accuracy</span>
                <span className="font-medium">{Math.round(progress?.lifetimeStats.accuracy || 0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Longest Streak</span>
                <span className="font-medium">{progress?.lifetimeStats.longestStreak || 0} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Study Time</span>
                <span className="font-medium">
                  {Math.round((sessions.reduce((sum, s) => sum + s.totalTime, 0)) / 3600)}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12 mt-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Start Your Learning Journey</h3>
            <p className="text-muted-foreground mb-4">
              Create your first flashcard to see detailed statistics and track your progress.
            </p>
            <button
              onClick={() => window.location.href = '/cards/new'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create First Card
            </button>
          </div>
        )}
      </main>
    </div>
  );
}