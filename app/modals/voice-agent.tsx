import React from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native';
import VoiceAgentScreen from '../../src/components/voice/VoiceAgentScreen';
import { useTheme } from '../../src/constants/ThemeContext';

export default function VoiceAgentModal() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {Platform.OS !== 'web' && (
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      )}
      <VoiceAgentScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
