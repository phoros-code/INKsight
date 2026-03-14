import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/colors';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        presentation: 'modal',
        contentStyle: { backgroundColor:Colors.darkBg }
      }}
    >
      <Stack.Screen name="emotion-wheel" />
      <Stack.Screen name="safe-space" options={{ animation: 'fade' }} />
      <Stack.Screen name="weekly-summary" options={{ animation: 'fade' }} />
      <Stack.Screen name="grounding" options={{ animation: 'slide_from_right' }} />
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
