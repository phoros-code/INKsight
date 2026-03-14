import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../src/constants/colors';

const { width } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function WelcomeScreen() {
  const router = useRouter();

  // Animation values for the bezier curves
  const shift1 = useSharedValue(0);
  const shift2 = useSharedValue(0);
  const shift3 = useSharedValue(0);

  useEffect(() => {
    shift1.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    shift2.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    shift3.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedProps1 = useAnimatedProps(() => {
    const s = shift1.value;
    return {
      d: `M-20,100 C${100 + s},0 ${200 - s},300 ${width + 20},150`,
    };
  });

  const animatedProps2 = useAnimatedProps(() => {
    const s = shift2.value;
    return {
      d: `M-20,150 C${150 + s},300 ${250 - s},50 ${width + 20},200`,
    };
  });

  const animatedProps3 = useAnimatedProps(() => {
    const s = shift3.value;
    return {
      d: `M-20,200 C${120 + s},100 ${280 - s},280 ${width + 20},100`,
    };
  });

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/privacy');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Abstract Animated Ink Strokes Background */}
      <View style={styles.svgContainer}>
        <Svg width={width} height={400}>
          <AnimatedPath
            animatedProps={animatedProps1}
            fill="none"
            stroke={Colors.primary}
            strokeWidth={3}
            opacity={0.7}
          />
          <AnimatedPath
            animatedProps={animatedProps2}
            fill="none"
            stroke={Colors.secondary}
            strokeWidth={3}
            opacity={0.7}
          />
          <AnimatedPath
            animatedProps={animatedProps3}
            fill="none"
            stroke={Colors.accent}
            strokeWidth={3}
            opacity={0.7}
          />
        </Svg>
      </View>

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.heading}>
            Your mind has patterns.{'\n'}Let's discover them together.
          </Text>
          <Text style={styles.body}>
            INKsight is your private reflection companion. No judgments. No
            diagnoses. Just you and your words.
          </Text>
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
          <Text style={styles.ctaText}>Begin Your Journey</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  svgContainer: {
    height: '45%',
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 50,
  },
  textContainer: {
    marginTop: -20,
  },
  heading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  body: {
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 25,
    paddingHorizontal: 10,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  ctaText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4DEE8',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
});
