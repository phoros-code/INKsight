import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface BreathingCircleProps {
  size?: number;
  color?: string;
  duration?: number;
  showLabel?: boolean;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  size = 120,
  color = '#7DBFA7', // Default sage green
  duration = 4000,
  showLabel = false,
}) => {
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    // 0 -> 1 -> 0 over the given duration x2
    animationProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      false
    );
  }, []);

  const animatedCircleStyle = useAnimatedStyle(() => {
    const scale = interpolate(animationProgress.value, [0, 1], [1.0, 1.2]);
    const opacity = interpolate(animationProgress.value, [0, 1], [0.6, 1.0]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animationProgress.value, [0, 0.5, 1], [0.5, 1, 0.5]),
    };
  });

  // Basic label logic (can be expanded to cycle texts strictly with timing if needed)
  const getPhaseText = () => {
    // For a smooth simple cycle, assuming 0->1 is In, 1->0 is Out
    // Since useAnimatedStyle doesn't easily drive React state text directly without a JS thread bridge, 
    // we'll keep it simple: "Breathe..." for now, or just leave it.
    return "Breathe...";
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          animatedCircleStyle,
        ]}
      />
      
      {showLabel && (
        <Animated.Text style={[styles.label, animatedTextStyle]}>
          {getPhaseText()}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  label: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 200,
    fontSize: 18,
  },
});
