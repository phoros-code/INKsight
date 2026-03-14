/**
 * INKsight Theme Context
 * Provides 3 switchable themes from the Stitch design system:
 *   - Sunset Solace (warm cream default)
 *   - Midnight Moss (dark mode)
 *   - Lavender Lullaby (soft purple)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type ThemeName = 'sunset' | 'midnight' | 'lavender';

export interface ThemePalette {
  name: ThemeName;
  label: string;
  // Core surface colors
  background: string;
  card: string;
  primary: string;
  // Text
  textMain: string;
  textMuted: string;
  // Derived
  isDark: boolean;
  // Button text on primary bg
  primaryButtonText: string;
}

export const THEMES: Record<ThemeName, ThemePalette> = {
  sunset: {
    name: 'sunset',
    label: 'Sunset Solace',
    background: '#F5F2EE',
    card: '#FFFFFF',
    primary: '#E8A87C',
    textMain: '#2D3748',
    textMuted: '#718096',
    isDark: false,
    primaryButtonText: '#FFFFFF',
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight Moss',
    background: '#1E2A3A',
    card: '#253447',
    primary: '#7DBFA7',
    textMain: '#FFFFFF',
    textMuted: '#A0AEC0',
    isDark: true,
    primaryButtonText: '#1E2A3A',
  },
  lavender: {
    name: 'lavender',
    label: 'Lavender Lullaby',
    background: '#F4F0F7',
    card: '#FFFFFF',
    primary: '#9A97C1',
    textMain: '#2D3748',
    textMuted: '#718096',
    isDark: false,
    primaryButtonText: '#FFFFFF',
  },
};

interface ThemeContextValue {
  theme: ThemePalette;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.sunset,
  themeName: 'sunset',
  setTheme: () => {},
});

const STORAGE_KEY = 'inksight_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('sunset');

  // Load saved theme
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
        if (saved && THEMES[saved]) setThemeName(saved);
      } catch {}
    }
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    if (Platform.OS === 'web') {
      try { localStorage.setItem(STORAGE_KEY, name); } catch {}
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeName], themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
