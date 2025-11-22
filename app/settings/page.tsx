"use client";

import { useState, useEffect } from 'react';
import { Navigation } from '@/app/components/navigation';
import { SettingsStorage, BackupStorage } from '@/app/lib/storage';
import { StudySettings } from '@/app/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<StudySettings>({
    dailyGoal: 20,
    maxNewCards: 10,
    maxReviews: 50,
    showTimer: true,
    autoAdvance: false,
    shuffleCards: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const loadedSettings = SettingsStorage.get();
    setSettings(loadedSettings);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    SettingsStorage.save(settings);

    setSaveMessage('Settings saved successfully!');
    setTimeout(() => {
      setSaveMessage('');
      setIsSaving(false);
    }, 2000);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const data = BackupStorage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spaced-repetition-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = BackupStorage.importData(content);

        if (success) {
          alert('Data imported successfully! The page will reload.');
          window.location.reload();
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Failed to import data. Please check the file format.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm(
      'Are you sure you want to clear all data? This action cannot be undone. Please export your data first!'
    )) {
      if (window.confirm(
        'This will permanently delete all your cards, progress, and study history. Are you absolutely sure?'
      )) {
        BackupStorage.clearAllData();
        alert('All data has been cleared. The page will reload.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your study experience and manage your data
          </p>
        </div>

        {/* Study Settings */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Study Settings</h2>

          <div className="space-y-6">
            {/* Daily Goal */}
            <div>
              <label htmlFor="dailyGoal" className="block text-sm font-medium text-foreground mb-2">
                Daily Goal
                <span className="ml-2 text-muted-foreground font-normal">
                  ({settings.dailyGoal} cards per day)
                </span>
              </label>
              <input
                type="range"
                id="dailyGoal"
                min="5"
                max="100"
                step="5"
                value={settings.dailyGoal}
                onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) })}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5</span>
                <span>100</span>
              </div>
            </div>

            {/* Max New Cards */}
            <div>
              <label htmlFor="maxNewCards" className="block text-sm font-medium text-foreground mb-2">
                New Cards Per Day
                <span className="ml-2 text-muted-foreground font-normal">
                  ({settings.maxNewCards} new cards)
                </span>
              </label>
              <input
                type="range"
                id="maxNewCards"
                min="1"
                max="50"
                step="1"
                value={settings.maxNewCards}
                onChange={(e) => setSettings({ ...settings, maxNewCards: parseInt(e.target.value) })}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            {/* Max Reviews */}
            <div>
              <label htmlFor="maxReviews" className="block text-sm font-medium text-foreground mb-2">
                Max Reviews Per Day
                <span className="ml-2 text-muted-foreground font-normal">
                  ({settings.maxReviews} reviews)
                </span>
              </label>
              <input
                type="range"
                id="maxReviews"
                min="10"
                max="200"
                step="10"
                value={settings.maxReviews}
                onChange={(e) => setSettings({ ...settings, maxReviews: parseInt(e.target.value) })}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10</span>
                <span>200</span>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="showTimer" className="text-sm font-medium text-foreground">
                    Show Timer
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Display response time during study sessions
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showTimer}
                  onClick={() => setSettings({ ...settings, showTimer: !settings.showTimer })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showTimer ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showTimer ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="shuffleCards" className="text-sm font-medium text-foreground">
                    Shuffle Cards
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Randomize card order in study sessions
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.shuffleCards}
                  onClick={() => setSettings({ ...settings, shuffleCards: !settings.shuffleCards })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.shuffleCards ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.shuffleCards ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="autoAdvance" className="text-sm font-medium text-foreground">
                    Auto Advance
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Automatically move to next card after rating
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoAdvance}
                  onClick={() => setSettings({ ...settings, autoAdvance: !settings.autoAdvance })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoAdvance ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoAdvance ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-between">
            {saveMessage && (
              <span className="text-sm text-green-600 dark:text-green-400">{saveMessage}</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Data Management</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Export Data</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Download all your flashcards, progress, and study history as a JSON file
              </p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-2">Import Data</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Restore your data from a previously exported JSON file. This will replace all current data.
              </p>
              <label className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer inline-block">
                {isImporting ? 'Importing...' : 'Import Data'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-destructive mb-2">Clear All Data</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Permanently delete all your flashcards, categories, progress, and study history. This action cannot be undone!
              </p>
              <button
                onClick={handleClearData}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
