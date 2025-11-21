"use client";

import { useState, useEffect } from 'react';
import { Navigation } from '@/app/components/navigation';
import { SessionStorage } from '@/app/lib/storage';
import { StudySession } from '@/app/types';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    const loadSessions = () => {
      const allSessions = SessionStorage.getAll();
      // Sort by start time descending (most recent first)
      const sorted = [...allSessions].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      setSessions(sorted);
      setIsLoading(false);
    };

    loadSessions();
  }, []);

  const getFilteredSessions = () => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);

      switch (filter) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return sessionDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filteredSessions = getFilteredSessions();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDateTime = (date: Date) => {
    const dateObj = new Date(date);
    return {
      date: dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    };
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (accuracy >= 70) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (accuracy >= 50) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  // Calculate stats for filtered sessions
  const stats = filteredSessions.reduce(
    (acc, session) => ({
      totalCards: acc.totalCards + session.cardsStudied,
      totalCorrect: acc.totalCorrect + session.correctAnswers,
      totalTime: acc.totalTime + session.totalTime,
      sessionCount: acc.sessionCount + 1,
    }),
    { totalCards: 0, totalCorrect: 0, totalTime: 0, sessionCount: 0 }
  );

  const overallAccuracy = stats.totalCards > 0
    ? Math.round((stats.totalCorrect / stats.totalCards) * 100)
    : 0;

  const averageCardsPerSession = stats.sessionCount > 0
    ? Math.round(stats.totalCards / stats.sessionCount)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading study history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Study History</h1>
          <p className="text-muted-foreground">
            View your complete study session history and track your progress over time
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-accent'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-accent'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-accent'
            }`}
          >
            Last 30 Days
          </button>
        </div>

        {/* Summary Stats */}
        {filteredSessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-foreground">{stats.sessionCount}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Cards Studied</div>
              <div className="text-2xl font-bold text-foreground">{stats.totalCards}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Overall Accuracy</div>
              <div className="text-2xl font-bold text-foreground">{overallAccuracy}%</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Study Time</div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(stats.totalTime / 60)}m
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No study sessions found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all'
                ? 'Start studying to build your history!'
                : 'No sessions found for this time period. Try a different filter.'}
            </p>
            <button
              onClick={() => window.location.href = '/study'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Start Studying
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const { date, time } = formatDateTime(session.startTime);
              const accuracy = session.cardsStudied > 0
                ? Math.round((session.correctAnswers / session.cardsStudied) * 100)
                : 0;

              return (
                <div
                  key={session.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Date and Time */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-foreground">{date}</span>
                        <span className="text-sm text-muted-foreground">{time}</span>
                      </div>
                      {session.endTime && (
                        <div className="text-xs text-muted-foreground">
                          Duration: {formatDuration(session.totalTime)}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Cards</div>
                        <div className="text-lg font-semibold text-foreground">
                          {session.cardsStudied}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Correct</div>
                        <div className="text-lg font-semibold text-green-600">
                          {session.correctAnswers}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Accuracy</div>
                        <div className={`text-lg font-semibold px-2 py-1 rounded ${getAccuracyColor(accuracy)}`}>
                          {accuracy}%
                        </div>
                      </div>
                    </div>

                    {/* Average Response Time */}
                    <div className="text-center md:text-right">
                      <div className="text-xs text-muted-foreground mb-1">Avg Response</div>
                      <div className="text-sm font-medium text-foreground">
                        {Math.round(session.averageResponseTime)}s
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredSessions.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredSessions.length} of {sessions.length} total sessions
          </div>
        )}
      </main>
    </div>
  );
}
