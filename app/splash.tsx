import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';

export default function SplashScreen() {
  const router = useRouter();
  const breatheAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();

    // Breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Auto-navigate after 3s
    const timer = setTimeout(() => {
      router.replace('/onboarding/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Watercolor header */}
      <View style={styles.headerImage}>
        <View style={styles.watercolorWash} />
        <View style={[styles.watercolorWash, { backgroundColor: Colors.primary, opacity: 0.1, top: 20 }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Ink Drop Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow} />
          <Text style={styles.iconText}>💧</Text>
        </View>

        {/* App Title */}
        <Text style={styles.title}>INKsight</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          The patterns in your words. The truth in your mind.
        </Text>
      </Animated.View>

      {/* Bottom Breathing Element */}
      <View style={styles.bottomSection}>
        <Animated.View style={[styles.breathingDot, { opacity: breatheAnim }]}>
          <View style={styles.breathingGlow} />
          <View style={styles.breathingCore} />
        </Animated.View>
        <View style={styles.progressDots}>
          <View style={[styles.dot, { backgroundColor: Colors.primary, opacity: 0.4 }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary, opacity: 0.1 }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary, opacity: 0.1 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerImage: {
    width: '100%',
    height: 140,
    overflow: 'hidden',
    position: 'relative',
  },
  watercolorWash: {
    position: 'absolute',
    width: '120%',
    height: 140,
    left: '-10%',
    backgroundColor: '#B8C9D9',
    opacity: 0.2,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 100,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  iconText: {
    fontSize: 56,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
    maxWidth: 260,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 80,
  },
  breathingDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.sage,
    opacity: 0.3,
  },
  breathingCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.sage,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
