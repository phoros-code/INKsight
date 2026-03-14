import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import Animated, { 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, 
  withSequence, Easing, cancelAnimation 
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { Colors } from '../../src/constants/colors';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const EXERCISES = [
  { id: 'breathing', icon: 'wind', title: 'Breathing Exercise', subtitle: 'Box breathing · 4-4-4-4', color: Colors.secondary },
  { id: 'grounding', icon: 'anchor', title: '5-4-3-2-1 Grounding', subtitle: '2 minutes to feel present', color: Colors.primary },
  { id: 'body-scan', icon: 'activity', title: 'Body Scan', subtitle: 'Notice where tension lives', color: '#C4A4C0' },
  { id: 'gratitude', icon: 'heart', title: 'Gratitude Pause', subtitle: '3 things you appreciate right now', color: Colors.accent },
];

export default function FlowScreen() {
  const router = useRouter();
  const [isBreathing, setIsBreathing] = useState(false);
  const [breatheText, setBreatheText] = useState('Tap to begin');
  const scale = useSharedValue(1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathing) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.4, { duration: 4000 }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000 }),
        ),
        -1,
        false
      );

      let phase = 'in';
      let count = 4;
      interval = setInterval(() => {
        if (phase === 'in') {
          setBreatheText(`Breathe in... ${count}`);
          count--;
          if (count === 0) { phase = 'hold1'; count = 4; }
        } else if (phase === 'hold1') {
          setBreatheText(`Hold... ${count}`);
          count--;
          if (count === 0) { phase = 'out'; count = 4; }
        } else if (phase === 'out') {
          setBreatheText(`Breathe out... ${count}`);
          count--;
          if (count === 0) { phase = 'hold2'; count = 4; }
        } else if (phase === 'hold2') {
          setBreatheText(`Hold... ${count}`);
          count--;
          if (count === 0) { phase = 'in'; count = 4; }
        }
      }, 1000);
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1);
      setBreatheText('Tap to begin');
    }

    return () => {
      if (interval) clearInterval(interval);
      cancelAnimation(scale);
    };
  }, [isBreathing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flow</Text>
        <Text style={styles.headerSubtitle}>Pause. Breathe. Be present.</Text>
      </View>

      {/* BREATHING HERO */}
      <View style={styles.breathingHero}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Haptics.selectionAsync();
            setIsBreathing(!isBreathing);
          }}
          style={styles.breathingCenter}
        >
          <View style={styles.circleContainer}>
            <AnimatedSvg height={120} width={120} style={animatedStyle}>
              <Defs>
                <RadialGradient id="breathGrad" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={Colors.secondary} stopOpacity="0.9" />
                  <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0.4" />
                </RadialGradient>
              </Defs>
              <SvgCircle cx={60} cy={60} r={60} fill="url(#breathGrad)" />
            </AnimatedSvg>
            <Text style={styles.breatheLabel}>Breathe</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.breatheInstructionText, isBreathing && styles.breatheInstructionActive]}>
          {breatheText}
        </Text>
        {isBreathing && (
          <TouchableOpacity onPress={() => setIsBreathing(false)} style={styles.stopBtn}>
            <Text style={styles.stopBtnText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* EXERCISES */}
      <Text style={styles.sectionTitle}>MINDFUL EXERCISES</Text>
      {EXERCISES.map((exercise) => (
        <TouchableOpacity 
          key={exercise.id} 
          style={styles.exerciseCard}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (exercise.id === 'grounding') {
              router.push('/modals/grounding');
            }
          }}
        >
          <View style={[styles.exerciseIcon, { backgroundColor: `${exercise.color}20` }]}>
            <Feather name={exercise.icon as any} size={20} color={exercise.color} />
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseTitle}>{exercise.title}</Text>
            <Text style={styles.exerciseSub}>{exercise.subtitle}</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#A0ADB8" />
        </TouchableOpacity>
      ))}

      {/* SAFE SPACE LINK */}
      <TouchableOpacity 
        style={styles.safeSpaceCard}
        onPress={() => router.push('/modals/safe-space')}
        activeOpacity={0.8}
      >
        <Text style={styles.safeSpaceEmoji}>💙</Text>
        <View style={styles.safeSpaceText}>
          <Text style={styles.safeSpaceTitle}>Need immediate support?</Text>
          <Text style={styles.safeSpaceSub}>Open your Safe Space</Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.secondary} />
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  breathingHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  breathingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  breatheLabel: {
    position: 'absolute',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  breatheInstructionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#A0ADB8',
    textAlign: 'center',
  },
  breatheInstructionActive: {
    fontFamily: 'Lora_400Regular',
    fontSize: 18,
    color: Colors.primary,
  },
  stopBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0EDE8',
  },
  stopBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: '#A0ADB8',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  exerciseSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  safeSpaceCard: {
    backgroundColor: '#EDF8F4',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeSpaceEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  safeSpaceText: {
    flex: 1,
  },
  safeSpaceTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  safeSpaceSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.secondary,
  },
});
