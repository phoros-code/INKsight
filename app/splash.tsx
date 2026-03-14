import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, withSequence, 
  withDelay, Easing 
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { Colors } from '../src/constants/colors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered fade-in
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    taglineOpacity.value = withDelay(1100, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    dotsOpacity.value = withDelay(1500, withTiming(1, { duration: 600 }));

    // Auto-transition after 2.5s
    const timer = setTimeout(() => {
      router.replace('/onboarding/welcome');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const logoAnim = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  const titleAnim = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const taglineAnim = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const dotsAnim = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }));

  return (
    <View style={styles.container}>
      {/* Watercolor Header — using gradient fallback on native, image on web */}
      <View style={styles.watercolorHeader}>
        <Svg width={width} height={220}>
          <Defs>
            <RadialGradient id="wave1" cx="30%" cy="40%" r="60%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={Colors.background} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="wave2" cx="70%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={Colors.secondary} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={Colors.background} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="wave3" cx="50%" cy="30%" r="55%">
              <Stop offset="0%" stopColor={Colors.accent} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={Colors.background} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <SvgCircle cx={width * 0.3} cy={80} r={150} fill="url(#wave1)" />
          <SvgCircle cx={width * 0.7} cy={120} r={130} fill="url(#wave2)" />
          <SvgCircle cx={width * 0.5} cy={60} r={120} fill="url(#wave3)" />
        </Svg>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {/* Ink Droplet Logo */}
        <Animated.View style={[styles.logoContainer, logoAnim]}>
          <Svg width={60} height={72}>
            <Defs>
              <RadialGradient id="dropGrad" cx="50%" cy="45%" r="50%">
                <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.9" />
                <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0.6" />
              </RadialGradient>
            </Defs>
            {/* Teardrop/ink drop shape */}
            <SvgCircle cx={30} cy={42} r={24} fill="url(#dropGrad)" />
            {/* Highlight */}
            <SvgCircle cx={24} cy={38} r={6} fill="#FFFFFF" opacity={0.3} />
          </Svg>
        </Animated.View>

        {/* Brand Title */}
        <Animated.Text style={[styles.title, titleAnim]}>INKsight</Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineAnim]}>
          The patterns in your words.{'\n'}The truth in your mind.
        </Animated.Text>
      </View>

      {/* Loading Dots */}
      <Animated.View style={[styles.dotsContainer, dotsAnim]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  watercolorHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    overflow: 'hidden',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 36,
    color: Colors.primary,
    marginBottom: 16,
  },
  tagline: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4DEE8',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.secondary,
  },
});
