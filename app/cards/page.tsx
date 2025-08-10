"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/app/components/navigation';
import { CardStorage, CategoryStorage } from '@/app/lib/storage';
import { Flashcard, Category } from '@/app/types';

function CardsPageContent() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'nextReview'>('created');

  useEffect(() => {
    setCards(CardStorage.getAll());
    setCategories(CategoryStorage.getAll());
    
    // Check for category filter from URL
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const filteredCards = cards
    .filter(card => 
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(card => !selectedCategory || card.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'nextReview':
          return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
        default:
          return 0;
      }
    });

  const handleDeleteCard = (id: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      CardStorage.delete(id);
      setCards(CardStorage.getAll());
    }
  };

  const getDifficultyColor = (easeFactor: number) => {
    if (easeFactor < 2.0) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (easeFactor < 2.3) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    if (easeFactor < 2.6) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
  };

  const getStatusColor = (card: Flashcard) => {
    const now = new Date();
    const isNew = card.repetitions === 0;
    const isDue = card.nextReviewDate <= now;
    
    if (isNew) return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    if (isDue) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20';
  };

  const getStatusText = (card: Flashcard) => {
    const now = new Date();
    const isNew = card.repetitions === 0;
    const isDue = card.nextReviewDate <= now;
    
    if (isNew) return 'New';
    if (isDue) return 'Due';
    return 'Learning';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Flashcards</h1>
            <p className="text-muted-foreground">
              Manage your flashcards and track your progress
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/categories'}
              className="border border-border text-foreground hover:bg-accent px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Manage Categories
            </button>
            <button
              onClick={() => window.location.href = '/cards/new'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add New Card
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="created">Sort by Created</option>
                <option value="updated">Sort by Updated</option>
                <option value="nextReview">Sort by Next Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No cards found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory ? 'Try adjusting your search or filters' : 'Get started by creating your first flashcard'}
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={() => window.location.href = '/cards/new'}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create First Card
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card)}`}>
                        {getStatusText(card)}
                      </span>
                      {card.category && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {card.category}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Front:</div>
                        <div className="text-foreground">{card.front}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Back:</div>
                        <div className="text-foreground text-sm">{card.back}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => window.location.href = `/cards/edit/${card.id}`}
                      className="p-2 hover:bg-accent rounded-md transition-colors"
                      title="Edit card"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                      title="Delete card"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card Statistics */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Reviews: {card.totalReviews}</span>
                      <span>Accuracy: {card.totalReviews > 0 ? Math.round((card.correctReviews / card.totalReviews) * 100) : 0}%</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(card.easeFactor)}`}>
                      EF: {card.easeFactor.toFixed(1)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Next review: {card.nextReviewDate.toLocaleDateString()}
                  </div>
                  {card.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {card.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCards.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredCards.length} of {cards.length} cards
          </div>
        )}
      </main>
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cards...</p>
          </div>
        </div>
      </div>
    }>
      <CardsPageContent />
    </Suspense>
  );
}