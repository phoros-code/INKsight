/**
 * MoodOrb — Stitch: orb-gradient radial-gradient(circle at 30% 30%, #a5b4fc, #818cf8)
 * Animated pulsing mood orb with dynamic color based on emotion.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface MoodOrbProps {
  size: number;
  emotion?: string;
  color?: string;
}

// Map emotion names to orb colors (Stitch uses purple/indigo for the orb)
const EMOTION_ORB_COLORS: Record<string, [string, string]> = {
  anxious: ['#89ABD4', '#5B8DB8'],
  overwhelmed: ['#A0B2C6', '#89ABD4'],
  tired: ['#D4CFC9', '#A0B2C6'],
  content: ['#a5b4fc', '#818cf8'], // Stitch default
  hopeful: ['#7DBFA7', '#5B8DB8'],
  peaceful: ['#a5b4fc', '#7DBFA7'],
  joyful: ['#F5D769', '#E6A87C'],
  curious: ['#E6A87C', '#D4956A'],
  uncertain: ['#D4CFC9', '#A0B2C6'],
  default: ['#a5b4fc', '#818cf8'], // Stitch orb-gradient default
};

export const MoodOrb: React.FC<MoodOrbProps> = ({ size, emotion, color }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors = emotion ? (EMOTION_ORB_COLORS[emotion] || EMOTION_ORB_COLORS.default) : EMOTION_ORB_COLORS.default;

  // Stitch: radial-gradient(circle at 30% 30%, #a5b4fc, #818cf8)
  // + box-shadow: inset -2px -2px 10px rgba(255,255,255,0.4), 0 4px 12px rgba(129,140,248,0.3)
  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        { backgroundColor: colors[1] },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.innerGlow,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            backgroundColor: colors[0],
            top: size * 0.15,
            left: size * 0.15,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(129, 140, 248, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    opacity: 0.6,
  },
});
