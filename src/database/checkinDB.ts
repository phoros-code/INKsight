import * as SQLite from 'expo-sqlite';
import { CheckIn } from '../types';

export const insertCheckin = async (
  db: SQLite.SQLiteDatabase,
  checkin: Partial<CheckIn>
): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const date = checkin.date || now.split('T')[0];

    // Upsert logic (Insert or Replace if date conflict)
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_checkins (
        date, sleep_quality, energy_level, social_connection, one_word, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        date,
        checkin.sleepQuality || null,
        checkin.energyLevel || null,
        checkin.socialConnection || null,
        checkin.oneWord || null,
        now
      ]
    );
  } catch (error) {
    console.error('❌ Error inserting daily check-in:', error);
    throw error;
  }
};

export const getCheckinByDate = async (
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<CheckIn | null> => {
  try {
    const result = await db.getFirstAsync<CheckIn>(
      'SELECT * FROM daily_checkins WHERE date = ? LIMIT 1',
      [date]
    );

    return result || null;
  } catch (error) {
    console.error(`❌ Error getting checkin for date ${date}:`, error);
    throw error;
  }
};

export const getCheckinsForRange = async (
  db: SQLite.SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<CheckIn[]> => {
  try {
    const results = await db.getAllAsync<CheckIn>(
      'SELECT * FROM daily_checkins WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [startDate, endDate]
    );
    
    return results || [];
  } catch (error) {
    console.error(`❌ Error getting checkins from ${startDate} to ${endDate}:`, error);
    return [];
  }
};
