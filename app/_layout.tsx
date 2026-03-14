import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/constants/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

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

import { seedWebDemoData } from '../src/utils/seedDemoData';

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

  // Auto-seed demo data on web first load
  useEffect(() => {
    if (Platform.OS === 'web') {
      seedWebDemoData();
    }
  }, []);

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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {content}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Native: wrap with SQLiteProvider
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="inksight.db" onInit={initDatabase}>
          {content}
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
