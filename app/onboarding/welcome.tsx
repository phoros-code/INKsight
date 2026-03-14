import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Watercolor Hero Area */}
      <View style={styles.heroArea}>
        <View style={styles.heroGradient} />
        <View style={styles.heroWash1} />
        <View style={styles.heroWash2} />
        <View style={styles.heroFade} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>
          Your mind has patterns.{'\n'}Let's discover them together.
        </Text>
        <Text style={styles.description}>
          INKsight is your private reflection companion. No judgments. No diagnoses. Just you and your words.
        </Text>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/onboarding/privacy')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>Begin Your Journey</Text>
        </TouchableOpacity>

        <View style={styles.progressDots}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: Colors.dotInactive }]} />
          <View style={[styles.dot, { backgroundColor: Colors.dotInactive }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  heroArea: {
    height: '40%',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    opacity: 0.06,
  },
  heroWash1: {
    position: 'absolute',
    top: 30,
    left: -20,
    width: '130%',
    height: '80%',
    backgroundColor: Colors.primary,
    opacity: 0.07,
    borderRadius: 100,
    transform: [{ rotate: '-15deg' }],
  },
  heroWash2: {
    position: 'absolute',
    bottom: 40,
    right: -20,
    width: '100%',
    height: '50%',
    backgroundColor: Colors.sage,
    opacity: 0.06,
    borderRadius: 80,
    transform: [{ rotate: '10deg' }],
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
    backgroundColor: Colors.background,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  headline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 24,
  },
  description: {
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 320,
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 32,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
