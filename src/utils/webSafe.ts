import { Platform } from 'react-native';

// Web-safe database hook - returns null on web, real SQLite context on native
export function useDatabase(): any {
  if (Platform.OS === 'web') {
    return {
      runAsync: async (...args: any[]) => { console.log('[Web] DB runAsync mock', args); },
      getFirstAsync: async (...args: any[]) => { console.log('[Web] DB getFirstAsync mock', args); return null; },
      getAllAsync: async (...args: any[]) => { console.log('[Web] DB getAllAsync mock', args); return []; },
      execAsync: async (...args: any[]) => { console.log('[Web] DB execAsync mock', args); },
    };
  }
  const { useSQLiteContext } = require('expo-sqlite');
  return useSQLiteContext();
}

// Web-safe haptics
export const SafeHaptics = {
  selectionAsync: async () => {
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      await Haptics.selectionAsync();
    }
  },
  impactAsync: async (style?: any) => {
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(style);
    }
  },
  notificationAsync: async (type?: any) => {
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      await Haptics.notificationAsync(type);
    }
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
