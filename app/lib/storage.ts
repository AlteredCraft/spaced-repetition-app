import {
  Flashcard,
  UserProgress,
  StudySession,
  Category,
  StudySettings,
  StorageKeys,
  DailyStats,
} from '@/app/types';

// Generic storage utilities
export class Storage {
  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // Convert date strings back to Date objects
      return this.reviveDates(parsed);
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Helper function to convert date strings back to Date objects
  private static reviveDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // Check if it's a date string
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (dateRegex.test(obj)) {
        const date = new Date(obj);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.reviveDates(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.reviveDates(obj[key]);
      }
      return result;
    }
    
    return obj;
  }
}

// Flashcards storage operations
export class CardStorage {
  static getAll(): Flashcard[] {
    return Storage.get<Flashcard[]>(StorageKeys.CARDS) || [];
  }

  static save(cards: Flashcard[]): void {
    Storage.set(StorageKeys.CARDS, cards);
  }

  static add(card: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Flashcard {
    const cards = this.getAll();
    const newCard: Flashcard = {
      ...card,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: new Date(),
      totalReviews: 0,
      correctReviews: 0,
      streak: 0,
    };
    
    cards.push(newCard);
    this.save(cards);
    return newCard;
  }

  static update(id: string, updates: Partial<Flashcard>): Flashcard | null {
    const cards = this.getAll();
    const index = cards.findIndex(card => card.id === id);
    
    if (index === -1) return null;
    
    cards[index] = {
      ...cards[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    this.save(cards);
    return cards[index];
  }

  static delete(id: string): boolean {
    const cards = this.getAll();
    const index = cards.findIndex(card => card.id === id);
    
    if (index === -1) return false;
    
    cards.splice(index, 1);
    this.save(cards);
    return true;
  }

  static getById(id: string): Flashcard | null {
    const cards = this.getAll();
    return cards.find(card => card.id === id) || null;
  }

  static getDueCards(): Flashcard[] {
    const cards = this.getAll();
    const now = new Date();
    return cards.filter(card => card.nextReviewDate <= now);
  }

  static getNewCards(): Flashcard[] {
    const cards = this.getAll();
    return cards.filter(card => card.repetitions === 0);
  }

  static getByCategory(category: string): Flashcard[] {
    const cards = this.getAll();
    return cards.filter(card => card.category === category);
  }
}

// User progress storage operations
export class ProgressStorage {
  static get(): UserProgress {
    const defaultProgress: UserProgress = {
      totalCards: 0,
      cardsLearned: 0,
      cardsDue: 0,
      streakDays: 0,
      totalStudyTime: 0,
      dailyStats: [],
      lifetimeStats: {
        totalReviews: 0,
        correctReviews: 0,
        accuracy: 0,
        longestStreak: 0,
        totalCardsCreated: 0,
      },
    };
    
    return Storage.get<UserProgress>(StorageKeys.USER_PROGRESS) || defaultProgress;
  }

  static save(progress: UserProgress): void {
    Storage.set(StorageKeys.USER_PROGRESS, progress);
  }

  static updateDailyStats(date: string, stats: Partial<DailyStats>): void {
    const progress = this.get();
    const existingIndex = progress.dailyStats.findIndex(s => s.date === date);
    
    if (existingIndex !== -1) {
      progress.dailyStats[existingIndex] = {
        ...progress.dailyStats[existingIndex],
        ...stats,
      };
    } else {
      const newStats: DailyStats = {
        date,
        cardsStudied: 0,
        correctAnswers: 0,
        studyTime: 0,
        newCards: 0,
        ...stats,
      };
      progress.dailyStats.push(newStats);
    }
    
    this.save(progress);
  }
}

// Study sessions storage operations
export class SessionStorage {
  static getAll(): StudySession[] {
    return Storage.get<StudySession[]>(StorageKeys.STUDY_SESSIONS) || [];
  }

  static save(sessions: StudySession[]): void {
    Storage.set(StorageKeys.STUDY_SESSIONS, sessions);
  }

  static add(session: Omit<StudySession, 'id'>): StudySession {
    const sessions = this.getAll();
    const newSession: StudySession = {
      ...session,
      id: generateId(),
    };
    
    sessions.push(newSession);
    this.save(sessions);
    return newSession;
  }

  static update(id: string, updates: Partial<StudySession>): StudySession | null {
    const sessions = this.getAll();
    const index = sessions.findIndex(session => session.id === id);
    
    if (index === -1) return null;
    
    sessions[index] = {
      ...sessions[index],
      ...updates,
    };
    
    this.save(sessions);
    return sessions[index];
  }
}

// Categories storage operations
export class CategoryStorage {
  static getAll(): Category[] {
    return Storage.get<Category[]>(StorageKeys.CATEGORIES) || [];
  }

  static save(categories: Category[]): void {
    Storage.set(StorageKeys.CATEGORIES, categories);
  }

  static add(category: Omit<Category, 'id' | 'cardCount'>): Category {
    const categories = this.getAll();
    const newCategory: Category = {
      ...category,
      id: generateId(),
      cardCount: 0,
    };
    
    categories.push(newCategory);
    this.save(categories);
    return newCategory;
  }

  static updateCardCount(categoryName: string, count: number): void {
    const categories = this.getAll();
    const category = categories.find(c => c.name === categoryName);
    
    if (category) {
      category.cardCount = count;
      this.save(categories);
    }
  }
}

// Settings storage operations
export class SettingsStorage {
  static get(): StudySettings {
    const defaultSettings: StudySettings = {
      dailyGoal: 20,
      maxNewCards: 10,
      maxReviews: 50,
      showTimer: true,
      autoAdvance: false,
      shuffleCards: true,
    };
    
    return Storage.get<StudySettings>(StorageKeys.SETTINGS) || defaultSettings;
  }

  static save(settings: StudySettings): void {
    Storage.set(StorageKeys.SETTINGS, settings);
  }

  static update(updates: Partial<StudySettings>): StudySettings {
    const currentSettings = this.get();
    const newSettings = {
      ...currentSettings,
      ...updates,
    };
    
    this.save(newSettings);
    return newSettings;
  }
}

// Utility functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTodayString(): string {
  return formatDate(new Date());
}

// Data migration and backup utilities
export class BackupStorage {
  static exportData(): string {
    const data = {
      cards: CardStorage.getAll(),
      progress: ProgressStorage.get(),
      sessions: SessionStorage.getAll(),
      categories: CategoryStorage.getAll(),
      settings: SettingsStorage.get(),
      exportDate: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.cards) CardStorage.save(data.cards);
      if (data.progress) ProgressStorage.save(data.progress);
      if (data.sessions) SessionStorage.save(data.sessions);
      if (data.categories) CategoryStorage.save(data.categories);
      if (data.settings) SettingsStorage.save(data.settings);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  static clearAllData(): void {
    Storage.remove(StorageKeys.CARDS);
    Storage.remove(StorageKeys.USER_PROGRESS);
    Storage.remove(StorageKeys.STUDY_SESSIONS);
    Storage.remove(StorageKeys.CATEGORIES);
    Storage.remove(StorageKeys.SETTINGS);
  }
}