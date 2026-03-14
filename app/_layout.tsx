import React, { useEffect, useState } from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet as RNStyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/constants/colors';
import { ThemeProvider } from '../src/constants/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// ─── Web Passcode Lock ──────────────────────────────
function WebPasscodeLock({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const enabled = localStorage.getItem('inksight_passcode_enabled');
      const passcode = localStorage.getItem('inksight_passcode');
      if (enabled && JSON.parse(enabled) && passcode) {
        setLocked(true);
      }
    } catch {}
  }, []);

  if (!locked) return <>{children}</>;

  const handleDigit = (d: string) => {
    const next = code + d;
    setError('');
    if (next.length === 4) {
      try {
        const saved = JSON.parse(localStorage.getItem('inksight_passcode') || '""');
        if (next === saved) {
          setLocked(false);
        } else {
          setError('Incorrect passcode');
          setCode('');
        }
      } catch {
        setError('Error checking passcode');
        setCode('');
      }
    } else {
      setCode(next);
    }
  };

  const handleDelete = () => { setCode(code.slice(0, -1)); setError(''); };

  return (
    <View style={lockStyles.container}>
      <Text style={lockStyles.logo}>INK<Text style={lockStyles.logoGreen}>sight</Text></Text>
      <Text style={lockStyles.subtitle}>Enter your passcode</Text>
      <View style={lockStyles.dots}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[lockStyles.dot, code.length > i && lockStyles.dotFilled]} />
        ))}
      </View>
      {error ? <Text style={lockStyles.error}>{error}</Text> : null}
      <View style={lockStyles.numpad}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
          <View key={ri} style={lockStyles.numRow}>
            {row.map((d, di) => (
              <TouchableOpacity
                key={di}
                style={[lockStyles.numBtn, !d && { opacity: 0 }]}
                onPress={() => d === '⌫' ? handleDelete() : d ? handleDigit(d) : null}
                disabled={!d}
                activeOpacity={0.6}
              >
                <Text style={lockStyles.numText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const lockStyles = RNStyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 36, fontWeight: '700', color: '#D4956A', marginBottom: 8 },
  logoGreen: { color: '#7DBFA7' },
  subtitle: { fontSize: 16, color: '#94A3B8', marginBottom: 32 },
  dots: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D4956A' },
  dotFilled: { backgroundColor: '#D4956A' },
  error: { fontSize: 13, color: '#EF4444', marginBottom: 8 },
  numpad: { marginTop: 24, gap: 12 },
  numRow: { flexDirection: 'row', gap: 24, justifyContent: 'center' },
  numBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 24, fontWeight: '600', color: '#F8FAFC' },
});

import { 
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold
} from '@expo-google-fonts/nunito';

import {
  Lora_400Regular,
  Lora_400Regular_Italic
} from '@expo-google-fonts/lora';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';

// Only import native modules on native platforms
let SQLiteProvider: any = null;
let initDatabase: any = null;
let BiometricLock: any = null;
let SplashScreen: any = null;

if (Platform.OS !== 'web') {
  SQLiteProvider = require('expo-sqlite').SQLiteProvider;
  initDatabase = require('../src/database/schema').initDatabase;
  BiometricLock = require('../src/components/BiometricLock').BiometricLock;
  SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Nunito: Nunito_400Regular,
    Lora: Lora_400Regular,
    Inter: Inter_400Regular,
  });

  // Demo data is loaded manually from Settings > Load Demo Data (Dev)

  const [isReady, setIsReady] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(Platform.OS === 'web'); // Skip lock on web
  const [biometricsEnabled, setBiometricsEnabled] = useState(Platform.OS !== 'web');

  useEffect(() => {
    async function prepareApp() {
      try {
        const onboardingValue = await AsyncStorage.getItem('onboarding_complete');
        setIsOnboardingComplete(onboardingValue === 'true');
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }
    
    if (fontsLoaded || fontError) {
      prepareApp();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isReady || !fontsLoaded) return;

    async function handleRouting() {
      // Re-read onboarding state fresh from AsyncStorage every time
      // (emotion-check.tsx may have set it since our initial read)
      const freshValue = await AsyncStorage.getItem('onboarding_complete');
      const onboardingDone = freshValue === 'true';

      // Keep React state in sync
      if (onboardingDone !== isOnboardingComplete) {
        setIsOnboardingComplete(onboardingDone);
      }

      if (SplashScreen) SplashScreen.hideAsync();

      const inOnboarding = segments[0] === 'onboarding';

      if (!onboardingDone && !inOnboarding) {
        router.replace('/onboarding/welcome');
      } else if (onboardingDone && !isUnlocked && biometricsEnabled) {
        // Wait for biometric unlock
      } else if (onboardingDone && inOnboarding) {
        router.replace('/(tabs)');
      } else if (onboardingDone && (isUnlocked || !biometricsEnabled) && !inOnboarding) {
        checkWeeklySummary();
      }
    }

    handleRouting();
  }, [isReady, fontsLoaded, isUnlocked, segments]);

  const checkWeeklySummary = async () => {
    const today = new Date();
    if (today.getDay() === 0) {
      const todayStr = today.toISOString().split('T')[0];
      const lastShown = await AsyncStorage.getItem('last_summary_shown');
      if (lastShown !== todayStr) {
         setTimeout(() => {
            router.push('/modals/weekly-summary');
            AsyncStorage.setItem('last_summary_shown', todayStr);
         }, 2000);
      }
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Native: biometric lock screen
  if (Platform.OS !== 'web' && isReady && isOnboardingComplete && biometricsEnabled && !isUnlocked && BiometricLock && SQLiteProvider) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SQLiteProvider databaseName="inksight.db" onInit={initDatabase}>
            <BiometricLock onUnlock={() => setIsUnlocked(true)} />
          </SQLiteProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Main App Shell
  const content = (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );

  // On web, skip SQLiteProvider (it crashes)
  if (Platform.OS === 'web') {
    return (
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <WebPasscodeLock>
              {content}
            </WebPasscodeLock>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    );
  }

  // Native: wrap with SQLiteProvider
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SQLiteProvider databaseName="inksight.db" onInit={initDatabase}>
            {content}
          </SQLiteProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
