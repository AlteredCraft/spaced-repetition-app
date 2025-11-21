"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/app/components/navigation';
import { CardStorage, CategoryStorage } from '@/app/lib/storage';
import { Category, Flashcard } from '@/app/types';

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;

  const [card, setCard] = useState<Flashcard | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const loadCard = () => {
      const loadedCard = CardStorage.getById(cardId);
      if (!loadedCard) {
        router.push('/cards');
        return;
      }

      setCard(loadedCard);
      setFront(loadedCard.front);
      setBack(loadedCard.back);
      setCategory(loadedCard.category || '');
      setTags(loadedCard.tags.join(', '));
      setCategories(CategoryStorage.getAll());
      setIsLoading(false);
    };

    loadCard();
  }, [cardId, router]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!front.trim()) {
      newErrors.front = 'Front side is required';
    }

    if (!back.trim()) {
      newErrors.back = 'Back side is required';
    }

    if (front.trim().length > 500) {
      newErrors.front = 'Front side must be less than 500 characters';
    }

    if (back.trim().length > 1000) {
      newErrors.back = 'Back side must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !card) {
      return;
    }

    setIsSubmitting(true);

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create new category if it doesn't exist
      if (category && category.trim()) {
        const existingCategory = categories.find(cat =>
          cat.name.toLowerCase() === category.trim().toLowerCase()
        );

        if (!existingCategory) {
          CategoryStorage.add({
            name: category.trim(),
            color: getRandomColor(),
            description: `Auto-created category for ${category.trim()}`,
          });
        }
      }

      // Update the old category card count if category changed
      if (card.category && card.category !== category.trim()) {
        const allCards = CardStorage.getAll();
        const oldCategoryCards = allCards.filter(c => c.category === card.category && c.id !== card.id);
        CategoryStorage.updateCardCount(card.category, oldCategoryCards.length);
      }

      // Update the card
      CardStorage.update(cardId, {
        front: front.trim(),
        back: back.trim(),
        category: category.trim() || undefined,
        tags: tagArray,
      });

      // Update new category card count
      if (category && category.trim()) {
        const allCards = CardStorage.getAll();
        const categoryCards = allCards.filter(c => c.category === category.trim());
        CategoryStorage.updateCardCount(category.trim(), categoryCards.length);
      }

      router.push('/cards');
    } catch (error) {
      console.error('Error updating card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/cards');
  };

  const getRandomColor = () => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // emerald
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Flashcard</h1>
          <p className="text-muted-foreground">
            Update your flashcard details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Front Side */}
          <div>
            <label htmlFor="front" className="block text-sm font-medium text-foreground mb-2">
              Front Side <span className="text-destructive">*</span>
            </label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="What do you want to remember? (e.g., question, term, prompt)"
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                errors.front ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.front && (
              <p className="mt-1 text-sm text-destructive">{errors.front}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {front.length}/500 characters
            </p>
          </div>

          {/* Back Side */}
          <div>
            <label htmlFor="back" className="block text-sm font-medium text-foreground mb-2">
              Back Side <span className="text-destructive">*</span>
            </label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="The answer or explanation"
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                errors.back ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.back && (
              <p className="mt-1 text-sm text-destructive">{errors.back}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {back.length}/1000 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <div className="relative">
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select or create a category"
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                list="categories-list"
              />
              <datalist id="categories-list">
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </datalist>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Type to create a new category or select from existing ones
            </p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas (e.g., vocabulary, chapter1, important)"
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Add tags to make your cards easier to find and organize
            </p>
          </div>

          {/* Card Stats Info */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Card Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Reviews:</span>
                <span className="ml-2 font-medium">{card.totalReviews}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <span className="ml-2 font-medium">
                  {card.totalReviews > 0 ? Math.round((card.correctReviews / card.totalReviews) * 100) : 0}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Ease Factor:</span>
                <span className="ml-2 font-medium">{card.easeFactor.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Streak:</span>
                <span className="ml-2 font-medium">{card.streak}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-border text-foreground hover:bg-accent rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Preview */}
        {(front || back) && (
          <div className="mt-12 p-6 border border-border rounded-lg bg-card">
            <h3 className="text-lg font-medium text-foreground mb-4">Preview</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Front:</div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  {front || <span className="text-muted-foreground italic">Front side will appear here...</span>}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Back:</div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  {back || <span className="text-muted-foreground italic">Back side will appear here...</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
