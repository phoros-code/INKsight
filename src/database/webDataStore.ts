/**
 * Web-compatible in-memory data store with localStorage persistence.
 * Mirrors SQLite schema: journal_entries, daily_checkins, pattern_insights
 * Used when Platform.OS === 'web' since expo-sqlite is unavailable.
 */

export interface WebJournalEntry {
  id: number;
  date: string;
  created_at: string;
  updated_at?: string;
  content: string;
  word_count: number;
  detected_emotions: string | null; // JSON string
  dominant_emotion: string | null;   // JSON string
  tags: string | null;               // JSON string
  mood_score: number | null;
  prompt_used: string | null;
  linguistic_score: string | null;   // JSON string
}

export interface WebCheckIn {
  id: number;
  date: string;
  sleep_quality: number;
  energy_level: number;
  focus?: string;
  quick_note?: string;
  created_at: string;
}

export interface WebPatternInsight {
  id: number;
  generated_at: string;
  insight_type: string;
  message: string;
  week_start: string;
}

// Simulated "current date" for demo date navigation
let _simulatedDate: string | null = null;

class WebDataStore {
  private entries: WebJournalEntry[] = [];
  private checkins: WebCheckIn[] = [];
  private patterns: WebPatternInsight[] = [];
  private nextEntryId = 1;
  private nextCheckinId = 1;
  private nextPatternId = 1;
  private _loaded = false;

  constructor() {
    this.loadFromStorage();
  }

  // ─── Date Simulation ───────────────────────────────────────
  setSimulatedDate(date: string | null) {
    _simulatedDate = date;
  }

  getSimulatedDate(): string | null {
    return _simulatedDate;
  }

  getCurrentDate(): string {
    if (_simulatedDate) return _simulatedDate;
    return new Date().toISOString().split('T')[0];
  }

  // ─── Persistence ──────────────────────────────────────────
  private loadFromStorage() {
    if (this._loaded) return;
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = localStorage.getItem('inksight_web_data');
      if (raw) {
        const data = JSON.parse(raw);
        this.entries = data.entries || [];
        this.checkins = data.checkins || [];
        this.patterns = data.patterns || [];
        this.nextEntryId = data.nextEntryId || 1;
        this.nextCheckinId = data.nextCheckinId || 1;
        this.nextPatternId = data.nextPatternId || 1;
      }
    } catch (e) {
      console.warn('[WebDataStore] Failed to load from localStorage:', e);
    }
    this._loaded = true;
  }

  private saveToStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem('inksight_web_data', JSON.stringify({
        entries: this.entries,
        checkins: this.checkins,
        patterns: this.patterns,
        nextEntryId: this.nextEntryId,
        nextCheckinId: this.nextCheckinId,
        nextPatternId: this.nextPatternId,
      }));
    } catch (e) {
      console.warn('[WebDataStore] Failed to save to localStorage:', e);
    }
  }

  // ─── Journal Entries ──────────────────────────────────────

  insertEntry(row: Omit<WebJournalEntry, 'id'>): number {
    const id = this.nextEntryId++;
    this.entries.push({ ...row, id });
    this.saveToStorage();
    return id;
  }

  updateEntry(id: number, updates: Partial<WebJournalEntry>) {
    const idx = this.entries.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.entries[idx] = { ...this.entries[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveToStorage();
    }
  }

  getEntryByDate(date: string): WebJournalEntry | null {
    const matches = this.entries
      .filter(e => e.date === date)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return matches[0] || null;
  }

  getEntriesByRange(startDate: string, endDate: string): WebJournalEntry[] {
    return this.entries
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getAllEntries(): WebJournalEntry[] {
    return [...this.entries].sort((a, b) => b.date.localeCompare(a.date));
  }

  getLatestEntry(): WebJournalEntry | null {
    if (this.entries.length === 0) return null;
    const sorted = [...this.entries].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return sorted[0];
  }

  deleteEntry(id: number) {
    this.entries = this.entries.filter(e => e.id !== id);
    this.saveToStorage();
  }

  getEntryCount(): number {
    return this.entries.length;
  }

  getStreakCount(): number {
    if (this.entries.length === 0) return 0;
    const today = this.getCurrentDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const dateSet = new Set(this.entries.map(e => e.date));
    if (!dateSet.has(today) && !dateSet.has(yesterdayStr)) return 0;

    let streak = 0;
    const d = new Date(dateSet.has(today) ? today : yesterdayStr);
    while (true) {
      const dStr = d.toISOString().split('T')[0];
      if (dateSet.has(dStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // ─── Check-Ins ────────────────────────────────────────────

  insertCheckIn(row: Omit<WebCheckIn, 'id'>): number {
    const id = this.nextCheckinId++;
    this.checkins.push({ ...row, id });
    this.saveToStorage();
    return id;
  }

  getCheckInByDate(date: string): WebCheckIn | null {
    return this.checkins.find(c => c.date === date) || null;
  }

  getCheckInsByRange(startDate: string, endDate: string): WebCheckIn[] {
    return this.checkins
      .filter(c => c.date >= startDate && c.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ─── Pattern Insights ─────────────────────────────────────

  insertPattern(row: Omit<WebPatternInsight, 'id'>): number {
    const id = this.nextPatternId++;
    this.patterns.push({ ...row, id });
    this.saveToStorage();
    return id;
  }

  getAllPatterns(): WebPatternInsight[] {
    return [...this.patterns].sort((a, b) => b.generated_at.localeCompare(a.generated_at));
  }

  // ─── Bulk operations (for seeding) ────────────────────────

  clearAll() {
    this.entries = [];
    this.checkins = [];
    this.patterns = [];
    this.nextEntryId = 1;
    this.nextCheckinId = 1;
    this.nextPatternId = 1;
    this.saveToStorage();
  }

  isSeeded(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      return localStorage.getItem('inksight_demo_seeded') === 'true';
    } catch { return false; }
  }

  markSeeded() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('inksight_demo_seeded', 'true');
      }
    } catch { /* ignore */ }
  }

  getFirstEntryDate(): string | null {
    if (this.entries.length === 0) return null;
    const sorted = [...this.entries].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0].date;
  }
}

// Singleton
export const webStore = new WebDataStore();
