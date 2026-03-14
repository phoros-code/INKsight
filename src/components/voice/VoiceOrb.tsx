import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceOrbProps {
  state: OrbState;
  primaryColor: string;
  onPress?: () => void;
}

const STATE_CONFIGS = {
  idle: { size: 80, innerSize: 56, glowOpacity: 0.15, pulseSpeed: 3000 },
  listening: { size: 100, innerSize: 72, glowOpacity: 0.4, pulseSpeed: 800 },
  processing: { size: 88, innerSize: 64, glowOpacity: 0.25, pulseSpeed: 1200 },
  speaking: { size: 96, innerSize: 68, glowOpacity: 0.35, pulseSpeed: 600 },
};

export default function VoiceOrb({ state, primaryColor }: VoiceOrbProps) {
  const scale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const innerOpacity = useSharedValue(0.7);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(glowScale);
    cancelAnimation(innerOpacity);

    const config = STATE_CONFIGS[state];

    switch (state) {
      case 'idle':
        // Slow, gentle breathing
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.95, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1, true
        );
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1, true
        );
        innerOpacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 1500 }),
            withTiming(0.8, { duration: 1500 })
          ),
          -1, true
        );
        break;

      case 'listening':
        // Active, energetic pulse
        scale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(0.9, { duration: 400, easing: Easing.in(Easing.ease) })
          ),
          -1, true
        );
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.6, { duration: 500 }),
            withTiming(1.1, { duration: 500 })
          ),
          -1, true
        );
        innerOpacity.value = withTiming(0.9, { duration: 300 });
        break;

      case 'processing':
        // Steady rotation feel via scale breathing
        scale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.96, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1, true
        );
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.4, { duration: 800 }),
            withTiming(1.0, { duration: 800 })
          ),
          -1, true
        );
        innerOpacity.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: 600 }),
            withTiming(0.9, { duration: 600 })
          ),
          -1, true
        );
        break;

      case 'speaking':
        // Lively, wave-like
        scale.value = withRepeat(
          withSequence(
            withSpring(1.12, { damping: 3, stiffness: 180 }),
            withSpring(0.92, { damping: 3, stiffness: 180 })
          ),
          -1, true
        );
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.5, { duration: 400 }),
            withTiming(1.0, { duration: 400 })
          ),
          -1, true
        );
        innerOpacity.value = withTiming(0.85, { duration: 200 });
        break;
    }
  }, [state]);

  const config = STATE_CONFIGS[state];

  const outerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: config.glowOpacity,
  }));

  const innerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: innerOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: config.size + 40,
            height: config.size + 40,
            borderRadius: (config.size + 40) / 2,
            backgroundColor: primaryColor,
          },
          glowAnimatedStyle,
        ]}
      />
      {/* Outer orb */}
      <Animated.View
        style={[
          styles.outer,
          {
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
            backgroundColor: primaryColor + '40',
            borderColor: primaryColor + '60',
          },
          outerAnimatedStyle,
        ]}
      >
        {/* Inner orb */}
        <Animated.View
          style={[
            styles.inner,
            {
              width: config.innerSize,
              height: config.innerSize,
              borderRadius: config.innerSize / 2,
              backgroundColor: primaryColor,
            },
            innerAnimatedStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  glow: {
    position: 'absolute',
  },
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
