import { Platform } from 'react-native';
import { JournalEntry } from '../types';

const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

export const insertEntry = async (
  db: any,
  entry: Partial<JournalEntry>
): Promise<number> => {
  if (Platform.OS === 'web' || !db) return 0;
  try {
    const now = new Date().toISOString();
    
    // Convert object fields to JSON strings for SQLite
    const detectedEmotionsStr = entry.detectedEmotions ? JSON.stringify(entry.detectedEmotions) : null;
    const dominantEmotionStr = entry.dominantEmotion ? JSON.stringify(entry.dominantEmotion) : null;
    const tagsStr = entry.tags ? JSON.stringify(entry.tags) : null;
    const linguisticScoreStr = entry.linguisticScore ? JSON.stringify(entry.linguisticScore) : null;

    const result = await db.runAsync(
      `INSERT INTO journal_entries (
        date, created_at, content, word_count, 
        detected_emotions, dominant_emotion, tags, 
        mood_score, prompt_used, linguistic_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.date || now.split('T')[0],
        now,
        entry.content || '',
        entry.wordCount || 0,
        detectedEmotionsStr,
        dominantEmotionStr,
        tagsStr,
        entry.moodScore || null,
        entry.promptUsed || null,
        linguisticScoreStr
      ]
    );
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('❌ Error inserting journal entry:', error);
    throw error;
  }
};

export const updateEntry = async (
  db: any,
  id: number,
  updates: Partial<JournalEntry>
): Promise<void> => {
  if (Platform.OS === 'web' || !db) return;
  try {
    const now = new Date().toISOString();
    
    // Convert object fields to JSON strings
    const detectedEmotionsStr = updates.detectedEmotions ? JSON.stringify(updates.detectedEmotions) : undefined;
    const dominantEmotionStr = updates.dominantEmotion ? JSON.stringify(updates.dominantEmotion) : undefined;
    const tagsStr = updates.tags ? JSON.stringify(updates.tags) : undefined;
    const linguisticScoreStr = updates.linguisticScore ? JSON.stringify(updates.linguisticScore) : undefined;

    // Build dynamic update query
    const fields = [];
    const values = [];

    if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
    if (updates.wordCount !== undefined) { fields.push('word_count = ?'); values.push(updates.wordCount); }
    if (detectedEmotionsStr !== undefined) { fields.push('detected_emotions = ?'); values.push(detectedEmotionsStr); }
    if (dominantEmotionStr !== undefined) { fields.push('dominant_emotion = ?'); values.push(dominantEmotionStr); }
    if (tagsStr !== undefined) { fields.push('tags = ?'); values.push(tagsStr); }
    if (updates.moodScore !== undefined) { fields.push('mood_score = ?'); values.push(updates.moodScore); }

    fields.push('updated_at = ?');
    values.push(now);
    
    values.push(id); // for WHERE id = ?

    await db.runAsync(
      `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error(`❌ Error updating entry ${id}:`, error);
    throw error;
  }
};

export const getEntryByDate = async (
  db: any,
  date: string
): Promise<JournalEntry | null> => {
  if (Platform.OS === 'web' || !db) return null;
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC LIMIT 1',
      [date]
    );

    if (!result) return null;
    return parseEntryRow(result);
  } catch (error) {
    console.error(`❌ Error getting entry for date ${date}:`, error);
    throw error;
  }
};

export const getEntriesByRange = async (
  db: any,
  startDate: string,
  endDate: string
): Promise<JournalEntry[]> => {
  if (Platform.OS === 'web' || !db) return [];
  try {
    const results = await db.getAllAsync(
      'SELECT * FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [startDate, endDate]
    );
    
    return results.map(parseEntryRow);
  } catch (error) {
    console.error(`❌ Error getting entries from ${startDate} to ${endDate}:`, error);
    return [];
  }
};

export const getAllEntries = async (
  db: any
): Promise<JournalEntry[]> => {
  if (Platform.OS === 'web' || !db) return [];
  try {
    const results = await db.getAllAsync(
      'SELECT * FROM journal_entries ORDER BY date DESC'
    );
    return results.map(parseEntryRow);
  } catch (error) {
    console.error('❌ Error getting all entries:', error);
    return [];
  }
};

export const deleteEntry = async (
  db: any,
  id: number
): Promise<void> => {
  if (Platform.OS === 'web' || !db) return;
  try {
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
  } catch (error) {
    console.error(`❌ Error deleting entry ${id}:`, error);
    throw error;
  }
};

export const getEntryCount = async (db: any): Promise<number> => {
  if (Platform.OS === 'web' || !db) return 0;
  try {
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM journal_entries'
    );
    return result?.count || 0;
  } catch (error) {
    console.error('❌ Error getting entry count:', error);
    return 0;
  }
};

export const getStreakCount = async (db: any): Promise<number> => {
  if (Platform.OS === 'web' || !db) return 0;
  try {
    // A simplified streak calculation logic: fetch all distinct dates in descending order
    // and count consecutive days backwards from today or yesterday
    const results = await db.getAllAsync(
      'SELECT DISTINCT date FROM journal_entries ORDER BY date DESC'
    );
    
    if (results.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // Array of dates ["2026-03-09", "2026-03-08", etc]
    const dates = results.map((row: any) => row.date);
    
    let streak = 0;
    let currentDate = new Date();

    // Check if there's an entry today or yesterday to even start a streak
    if (!dates.includes(today) && !dates.includes(yesterday)) {
      return 0; // Streak broken
    }
    
    // Set starting point to verify backward
    if (!dates.includes(today)) {
      currentDate.setDate(currentDate.getDate() - 1); // start checking from yesterday
    }

    for (let i = 0; i < dates.length; i++) {
      const checkDateStr = currentDate.toISOString().split('T')[0];
      
      if (dates.includes(checkDateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // go back one day
      } else {
        break; // gap found
      }
    }

    return streak;
  } catch (error) {
    console.error('❌ Error calculating streak:', error);
    return 0;
  }
};

// Helper to parse DB row into proper JS objects
const parseEntryRow = (row: any): JournalEntry => {
  return {
    ...row,
    detectedEmotions: row.detected_emotions ? JSON.parse(row.detected_emotions) : [],
    dominantEmotion: row.dominant_emotion ? JSON.parse(row.dominant_emotion) : null,
    tags: row.tags ? JSON.parse(row.tags) : [],
    linguisticScore: row.linguistic_score ? JSON.parse(row.linguistic_score) : null,
  };
};
