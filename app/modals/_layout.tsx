import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';

export default function ModalsLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        presentation: 'modal',
        contentStyle: { backgroundColor: theme.background }
      }}
    >
      <Stack.Screen name="emotion-wheel" options={{ contentStyle: { backgroundColor: theme.isDark ? theme.background : Colors.darkBg } }} />
      <Stack.Screen name="safe-space" options={{ animation: 'fade' }} />
      <Stack.Screen name="weekly-summary" options={{ animation: 'fade', contentStyle: { backgroundColor: theme.isDark ? theme.background : Colors.darkBg } }} />
      <Stack.Screen name="grounding" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="word-mirror" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen  
        name="daily-checkin" 
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
