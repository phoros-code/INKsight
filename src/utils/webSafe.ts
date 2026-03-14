import { Platform } from 'react-native';

// ─── TYPE DEFINITIONS ────────────────────────────────
export interface WebSafeDB {
  getAllAsync: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  getFirstAsync: <T = any>(sql: string, params?: any[]) => Promise<T | null>;
  runAsync: (sql: string, params?: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
  execAsync: (sql: string) => Promise<void>;
  withTransactionAsync: (fn: () => Promise<void>) => Promise<void>;
}

// ─── WEB DATABASE (localStorage-backed fallback) ─────
class WebDatabase implements WebSafeDB {
  private storageKey = 'inksight_web_db';

  private getData(): Record<string, any[]> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  private setData(data: Record<string, any[]>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {}
  }

  async getAllAsync<T = any>(sql: string, _params?: any[]): Promise<T[]> {
    try {
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      if (!tableMatch) return [];
      const table = tableMatch[1];
      const data = this.getData();
      return (data[table] || []) as T[];
    } catch { return []; }
  }

  async getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.getAllAsync<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    try {
      const data = this.getData();
      const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
      if (insertMatch) {
        const table = insertMatch[1];
        if (!data[table]) data[table] = [];
        const newId = data[table].length + 1;
        data[table].push({ id: newId, _params: params, created_at: new Date().toISOString() });
        this.setData(data);
        return { lastInsertRowId: newId, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    } catch {
      return { lastInsertRowId: 0, changes: 0 };
    }
  }

  async execAsync(_sql: string): Promise<void> {}

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

// ─── NATIVE DATABASE PASSTHROUGH ────────────────────
class NativeDatabase implements WebSafeDB {
  private ctx: any;
  constructor(ctx: any) { this.ctx = ctx; }
  getAllAsync<T>(sql: string, params?: any[]) { return this.ctx.getAllAsync(sql, params); }
  getFirstAsync<T>(sql: string, params?: any[]) { return this.ctx.getFirstAsync(sql, params); }
  runAsync(sql: string, params?: any[]) { return this.ctx.runAsync(sql, params); }
  execAsync(sql: string) { return this.ctx.execAsync(sql); }
  withTransactionAsync(fn: () => Promise<void>) { return this.ctx.withTransactionAsync(fn); }
}

// ─── SINGLETON WEB DB ────────────────────────────────
const webDBInstance = Platform.OS === 'web' ? new WebDatabase() : null;

// ─── MAIN HOOK ───────────────────────────────────────
export function useDatabase(): WebSafeDB {
  if (Platform.OS === 'web') {
    return webDBInstance!;
  }
  // On native, use the real SQLite context
  try {
    const { useSQLiteContext } = require('expo-sqlite');
    const ctx = useSQLiteContext();
    return new NativeDatabase(ctx);
  } catch (e) {
    console.warn('[webSafe] useSQLiteContext failed, using web fallback:', e);
    return new WebDatabase();
  }
}

// ─── SAFE HAPTICS ────────────────────────────────────
export const SafeHaptics = {
  impactAsync: async (style?: any): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(style ?? Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },
  notificationAsync: async (type?: any): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.notificationAsync(type ?? Haptics.NotificationFeedbackType.Success);
    } catch {}
  },
  selectionAsync: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.selectionAsync();
    } catch {}
  },
  NotificationFeedbackType: {
    get Success() { return Platform.OS !== 'web' ? require('expo-haptics').NotificationFeedbackType.Success : 0; },
    get Warning() { return Platform.OS !== 'web' ? require('expo-haptics').NotificationFeedbackType.Warning : 1; },
    get Error() { return Platform.OS !== 'web' ? require('expo-haptics').NotificationFeedbackType.Error : 2; },
  },
  ImpactFeedbackStyle: {
    get Light() { return Platform.OS !== 'web' ? require('expo-haptics').ImpactFeedbackStyle.Light : 0; },
    get Medium() { return Platform.OS !== 'web' ? require('expo-haptics').ImpactFeedbackStyle.Medium : 1; },
    get Heavy() { return Platform.OS !== 'web' ? require('expo-haptics').ImpactFeedbackStyle.Heavy : 2; },
  },
};

// ─── SAFE MMKV ───────────────────────────────────────
export const SafeStorage = {
  getString: (key: string): string | undefined => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key) ?? undefined;
    }
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      return storage.getString(key);
    } catch { return undefined; }
  },
  set: (key: string, value: string | boolean): void => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, String(value));
      return;
    }
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      storage.set(key, value);
    } catch {}
  },
  delete: (key: string): void => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      storage.delete(key);
    } catch {}
  },
  getBoolean: (key: string): boolean | undefined => {
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      return val !== null ? val === 'true' : undefined;
    }
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      return storage.getBoolean(key);
    } catch { return undefined; }
  },
};

// ─── SAFE LOCAL AUTH ─────────────────────────────────
export const SafeLocalAuth = {
  hasHardwareAsync: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const LA = require('expo-local-authentication');
      return await LA.hasHardwareAsync();
    } catch { return false; }
  },
  authenticateAsync: async (opts?: any): Promise<{ success: boolean }> => {
    if (Platform.OS === 'web') return { success: true };
    try {
      const LA = require('expo-local-authentication');
      return await LA.authenticateAsync(opts);
    } catch { return { success: false }; }
  },
};

// ─── SAFE SHARING ────────────────────────────────────
export const SafeSharing = {
  shareAsync: async (uri: string, opts?: any): Promise<void> => {
    if (Platform.OS === 'web') {
      // Web fallback: try Web Share API, else download
      if (typeof navigator !== 'undefined' && navigator.share) {
        try { await navigator.share({ title: 'INKsight Export', text: uri }); return; }
        catch {}
      }
      if (typeof document !== 'undefined') {
        const a = document.createElement('a');
        a.href = uri; a.download = 'inksight-export.json';
        a.click();
      }
      return;
    }
    try {
      const Sharing = require('expo-sharing');
      await Sharing.shareAsync(uri, opts);
    } catch {}
  },
};
