"use client";

import { useState, useEffect } from 'react';
import { Navigation } from '@/app/components/navigation';
import { CategoryStorage, CardStorage } from '@/app/lib/storage';
import { Category } from '@/app/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const allCategories = CategoryStorage.getAll();
    const allCards = CardStorage.getAll();
    
    // Update card counts for each category
    const updatedCategories = allCategories.map(category => ({
      ...category,
      cardCount: allCards.filter(card => card.category === category.name).length
    }));
    
    setCategories(updatedCategories);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else {
      // Check for duplicate names (excluding current category being edited)
      const existingCategory = categories.find(cat => 
        cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        cat.id !== editingCategory?.id
      );
      if (existingCategory) {
        newErrors.name = 'A category with this name already exists';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (editingCategory) {
      // Update existing category
      const oldName = editingCategory.name;
      const updatedCategories = categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData, name: formData.name.trim() }
          : cat
      );
      
      CategoryStorage.save(updatedCategories);
      
      // Update cards that use this category if name changed
      if (oldName !== formData.name.trim()) {
        const cards = CardStorage.getAll();
        const updatedCards = cards.map(card => 
          card.category === oldName 
            ? { ...card, category: formData.name.trim() }
            : card
        );
        CardStorage.save(updatedCards);
      }
      
      setEditingCategory(null);
    } else {
      // Create new category
      CategoryStorage.add({
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim(),
      });
      setIsCreating(false);
    }

    // Reset form
    setFormData({ name: '', color: '#3B82F6', description: '' });
    loadCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || '',
    });
    setIsCreating(true);
  };

  const handleDelete = (category: Category) => {
    if (category.cardCount > 0) {
      if (!window.confirm(
        `This category has ${category.cardCount} cards. Deleting it will remove the category from all cards. Are you sure?`
      )) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this category?')) {
        return;
      }
    }

    // Remove category from all cards
    const cards = CardStorage.getAll();
    const updatedCards = cards.map(card => 
      card.category === category.name 
        ? { ...card, category: undefined }
        : card
    );
    CardStorage.save(updatedCards);

    // Delete the category
    const updatedCategories = categories.filter(cat => cat.id !== category.id);
    CategoryStorage.save(updatedCategories);
    
    loadCategories();
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#3B82F6', description: '' });
    setErrors({});
  };

  const colorOptions = [
    { value: '#3B82F6', name: 'Blue' },
    { value: '#EF4444', name: 'Red' },
    { value: '#10B981', name: 'Emerald' },
    { value: '#F59E0B', name: 'Amber' },
    { value: '#8B5CF6', name: 'Violet' },
    { value: '#EC4899', name: 'Pink' },
    { value: '#06B6D4', name: 'Cyan' },
    { value: '#84CC16', name: 'Lime' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">
              Organize your flashcards by topic or subject
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Category
          </button>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.name ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="Category name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: formData.color }}
                    />
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {colorOptions.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border text-foreground hover:bg-accent rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first category to organize your flashcards
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.cardCount} {category.cardCount === 1 ? 'card' : 'cards'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-accent rounded-md transition-colors"
                      title="Edit category"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                      title="Delete category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.description}
                  </p>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Created: {new Date().toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => window.location.href = `/cards?category=${encodeURIComponent(category.name)}`}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    View Cards →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}