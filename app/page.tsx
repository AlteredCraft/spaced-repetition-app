"use client";

import { useRouter } from 'next/navigation';
import { Navigation } from './components/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
            Master Any Subject with{' '}
            <span className="text-primary">Spaced Repetition</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A modern, efficient way to learn and retain knowledge using scientifically-proven spaced repetition techniques.
          </p>
          <div className="flex justify-center space-x-4 mb-12">
            <button 
              onClick={() => window.location.href = '/study'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Start Learning
            </button>
            <button 
              onClick={() => window.location.href = '/cards'}
              className="border border-border text-foreground hover:bg-accent px-8 py-3 rounded-lg font-medium transition-colors"
            >
              View Cards
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Algorithm</h3>
            <p className="text-muted-foreground">Our algorithm adapts to your learning pace, showing cards exactly when you need to review them.</p>
          </div>

          <div className="text-center p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
            <p className="text-muted-foreground">Monitor your learning progress with detailed statistics and insights.</p>
          </div>

          <div className="text-center p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m9-9H3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy to Use</h3>
            <p className="text-muted-foreground">Clean, intuitive interface that gets out of your way so you can focus on learning.</p>
          </div>
        </div>
      </main>
    </div>
  );
}