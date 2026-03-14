import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        contentStyle: { backgroundColor: Colors.background }
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="emotion-check" />
    </Stack>
  );
}
