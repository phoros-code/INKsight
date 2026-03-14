/**
 * journalDB.ts — Database abstraction layer.
 * Routes to SQLite on native, webDataStore on web.
 */
import { Platform } from 'react-native';
import { JournalEntry } from '../types';
import { webStore } from './webDataStore';

const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

// ─── Helper: parse DB/web row into typed JournalEntry ────────
const parseEntryRow = (row: any): JournalEntry => {
  return {
    ...row,
    id: String(row.id),
    wordCount: row.word_count ?? row.wordCount ?? 0,
    detectedEmotions: typeof row.detected_emotions === 'string'
      ? JSON.parse(row.detected_emotions)
      : (row.detectedEmotions || []),
    dominantEmotion: typeof row.dominant_emotion === 'string'
      ? JSON.parse(row.dominant_emotion)
      : (row.dominantEmotion || null),
    tags: typeof row.tags === 'string'
      ? JSON.parse(row.tags)
      : (row.tags || []),
    linguisticScore: typeof row.linguistic_score === 'string'
      ? JSON.parse(row.linguistic_score)
      : (row.linguisticScore || null),
    moodScore: row.mood_score ?? row.moodScore ?? null,
    promptUsed: row.prompt_used ?? row.promptUsed ?? null,
    date: row.date,
    content: row.content || '',
  };
};

// ─── INSERT ─────────────────────────────────────────────────
export const insertEntry = async (
  db: any,
  entry: Partial<JournalEntry>
): Promise<number> => {
  const now = new Date().toISOString();
  const detectedEmotionsStr = entry.detectedEmotions ? JSON.stringify(entry.detectedEmotions) : null;
  const dominantEmotionStr = entry.dominantEmotion ? JSON.stringify(entry.dominantEmotion) : null;
  const tagsStr = entry.tags ? JSON.stringify(entry.tags) : null;
  const linguisticScoreStr = entry.linguisticScore ? JSON.stringify(entry.linguisticScore) : null;

  if (Platform.OS === 'web') {
    return webStore.insertEntry({
      date: entry.date || now.split('T')[0],
      created_at: now,
      content: entry.content || '',
      word_count: entry.wordCount || 0,
      detected_emotions: detectedEmotionsStr,
      dominant_emotion: dominantEmotionStr,
      tags: tagsStr,
      mood_score: entry.moodScore || null,
      prompt_used: entry.promptUsed || null,
      linguistic_score: linguisticScoreStr,
    });
  }

  if (!db) return 0;
  try {
    const result = await db.runAsync(
      `INSERT INTO journal_entries (
        date, created_at, content, word_count,
        detected_emotions, dominant_emotion, tags,
        mood_score, prompt_used, linguistic_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.date || now.split('T')[0], now, entry.content || '', entry.wordCount || 0,
        detectedEmotionsStr, dominantEmotionStr, tagsStr,
        entry.moodScore || null, entry.promptUsed || null, linguisticScoreStr
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('❌ Error inserting journal entry:', error);
    throw error;
  }
};

// ─── UPDATE ─────────────────────────────────────────────────
export const updateEntry = async (
  db: any, id: number, updates: Partial<JournalEntry>
): Promise<void> => {
  if (Platform.OS === 'web') {
    const webUpdates: any = {};
    if (updates.content !== undefined) webUpdates.content = updates.content;
    if (updates.wordCount !== undefined) webUpdates.word_count = updates.wordCount;
    if (updates.detectedEmotions) webUpdates.detected_emotions = JSON.stringify(updates.detectedEmotions);
    if (updates.dominantEmotion) webUpdates.dominant_emotion = JSON.stringify(updates.dominantEmotion);
    if (updates.tags) webUpdates.tags = JSON.stringify(updates.tags);
    if (updates.moodScore !== undefined) webUpdates.mood_score = updates.moodScore;
    webStore.updateEntry(id, webUpdates);
    return;
  }

  if (!db) return;
  try {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
    if (updates.wordCount !== undefined) { fields.push('word_count = ?'); values.push(updates.wordCount); }
    if (updates.detectedEmotions) { fields.push('detected_emotions = ?'); values.push(JSON.stringify(updates.detectedEmotions)); }
    if (updates.dominantEmotion) { fields.push('dominant_emotion = ?'); values.push(JSON.stringify(updates.dominantEmotion)); }
    if (updates.tags) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
    if (updates.moodScore !== undefined) { fields.push('mood_score = ?'); values.push(updates.moodScore); }
    fields.push('updated_at = ?'); values.push(now);
    values.push(id);
    await db.runAsync(`UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`, values);
  } catch (error) {
    console.error(`❌ Error updating entry ${id}:`, error);
    throw error;
  }
};

// ─── GET BY DATE ────────────────────────────────────────────
export const getEntryByDate = async (db: any, date: string): Promise<JournalEntry | null> => {
  if (Platform.OS === 'web') {
    const row = webStore.getEntryByDate(date);
    return row ? parseEntryRow(row) : null;
  }
  if (!db) return null;
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC LIMIT 1', [date]
    );
    return result ? parseEntryRow(result) : null;
  } catch (error) {
    console.error(`❌ Error getting entry for date ${date}:`, error);
    throw error;
  }
};

// ─── GET BY RANGE ───────────────────────────────────────────
export const getEntriesByRange = async (db: any, startDate: string, endDate: string): Promise<JournalEntry[]> => {
  if (Platform.OS === 'web') {
    return webStore.getEntriesByRange(startDate, endDate).map(parseEntryRow);
  }
  if (!db) return [];
  try {
    const results = await db.getAllAsync(
      'SELECT * FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date DESC', [startDate, endDate]
    );
    return results.map(parseEntryRow);
  } catch (error) {
    console.error(`❌ Error getting entries from ${startDate} to ${endDate}:`, error);
    return [];
  }
};

// ─── GET ALL ────────────────────────────────────────────────
export const getAllEntries = async (db: any): Promise<JournalEntry[]> => {
  if (Platform.OS === 'web') {
    return webStore.getAllEntries().map(parseEntryRow);
  }
  if (!db) return [];
  try {
    const results = await db.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC');
    return results.map(parseEntryRow);
  } catch (error) {
    console.error('❌ Error getting all entries:', error);
    return [];
  }
};

// ─── DELETE ─────────────────────────────────────────────────
export const deleteEntry = async (db: any, id: number): Promise<void> => {
  if (Platform.OS === 'web') {
    webStore.deleteEntry(id);
    return;
  }
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
  } catch (error) {
    console.error(`❌ Error deleting entry ${id}:`, error);
    throw error;
  }
};

// ─── COUNT ──────────────────────────────────────────────────
export const getEntryCount = async (db: any): Promise<number> => {
  if (Platform.OS === 'web') return webStore.getEntryCount();
  if (!db) return 0;
  try {
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM journal_entries');
    return result?.count || 0;
  } catch (error) {
    console.error('❌ Error getting entry count:', error);
    return 0;
  }
};

// ─── STREAK ─────────────────────────────────────────────────
export const getStreakCount = async (db: any): Promise<number> => {
  if (Platform.OS === 'web') return webStore.getStreakCount();
  if (!db) return 0;
  try {
    const results = await db.getAllAsync('SELECT DISTINCT date FROM journal_entries ORDER BY date DESC');
    if (results.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const dates = results.map((row: any) => row.date);
    let streak = 0;
    let currentDate = new Date();

    if (!dates.includes(today) && !dates.includes(yesterday)) return 0;
    if (!dates.includes(today)) currentDate.setDate(currentDate.getDate() - 1);

    for (let i = 0; i < dates.length; i++) {
      const checkDateStr = currentDate.toISOString().split('T')[0];
      if (dates.includes(checkDateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  } catch (error) {
    console.error('❌ Error calculating streak:', error);
    return 0;
  }
};

// ─── GET LATEST ENTRY ───────────────────────────────────────
export const getLatestEntry = async (db: any): Promise<JournalEntry | null> => {
  if (Platform.OS === 'web') {
    const row = webStore.getLatestEntry();
    return row ? parseEntryRow(row) : null;
  }
  if (!db) return null;
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT 1'
    );
    return result ? parseEntryRow(result) : null;
  } catch (error) {
    console.error('❌ Error getting latest entry:', error);
    return null;
  }
};
