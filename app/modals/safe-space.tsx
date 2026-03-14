import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withRepeat,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';

import { Colors } from '../../src/constants/colors';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function SafeSpaceModal() {
  const router = useRouter();
  
  // Breathing Animation State
  const [isBreathing, setIsBreathing] = useState(false);
  const [breatheText, setBreatheText] = useState('Breathe in... 4');
  const scale = useSharedValue(1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathing) {
      // 4s In, 2s Hold, 4s Out cycle = 10s total loop
      scale.value = withRepeat(
        withSequence(
           withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
           withTiming(1.3, { duration: 2000 }), // Hold
           withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        false
      );

      // Text Sync (approximate)
      let phase = 'in'; // in, hold, out
      let count = 4;
      interval = setInterval(() => {
         if (phase === 'in') {
            setBreatheText(`Breathe in... ${count}`);
            count--;
            if (count === 0) { phase = 'hold'; count = 2; }
         } else if (phase === 'hold') {
            setBreatheText(`Hold... ${count}`);
            count--;
            if (count === 0) { phase = 'out'; count = 4; }
         } else if (phase === 'out') {
            setBreatheText(`Breathe out... ${count}`);
            count--;
            if (count === 0) { phase = 'in'; count = 4; }
         }
      }, 1000);

    } else {
       cancelAnimation(scale);
       scale.value = withTiming(1);
       setBreatheText('Tap to start breathing guide');
    }

    return () => {
       if (interval) clearInterval(interval);
       cancelAnimation(scale);
    };
  }, [isBreathing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL('tel:9152987821');
  };

  const handleGrounding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/modals/grounding');
  };

  const handleJournal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Passing a param to indicate emergency mode
    router.push('/(tabs)/journal?emergency=true'); 
  };

  return (
    <LinearGradient colors={['#F0F6FB', '#EDF8F4']} style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.heartEmoji}>💙</Text>
          <Text style={styles.title}>This moment will pass.</Text>
          <Text style={styles.subtitle}>
            You don't have to feel this alone.{"\n"}We're here, and so are others.
          </Text>
        </View>

        {/* BREATHING EXERCISE */}
        <View style={styles.breathingCard}>
           <TouchableOpacity 
             activeOpacity={0.9} 
             onPress={() => {
                Haptics.selectionAsync();
                setIsBreathing(!isBreathing);
             }}
             style={styles.breathingCenter}
           >
              <View style={styles.circleContainer}>
                <AnimatedSvg height={80} width={80} style={animatedStyle}>
                   <Defs>
                     <RadialGradient id="breathGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <Stop offset="0%" stopColor={Colors.secondary} stopOpacity="1" />
                        <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0.6" />
                     </RadialGradient>
                   </Defs>
                   <SvgCircle cx={40} cy={40} r={40} fill="url(#breathGrad)" />
                </AnimatedSvg>
              </View>
              <Text style={[styles.breathingText, isBreathing && styles.breathingTextActive]}>
                {breatheText}
              </Text>
           </TouchableOpacity>
        </View>

        {/* SUPPORT OPTIONS */}
        <View style={styles.optionsContainer}>
          
          {/* Option 1: Call */}
          <TouchableOpacity style={styles.optionCard} onPress={handleCall} activeOpacity={0.8}>
             <View style={styles.optionLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#EDF8F4' }]}>
                   <Feather name="phone" size={18} color={Colors.secondary} />
                </View>
                <View style={styles.optionTextContainer}>
                   <Text style={styles.optionTitle}>iCall India</Text>
                   <Text style={styles.optionSub}>9152987821 · Free · Confidential</Text>
                </View>
             </View>
             <View style={[styles.actionPill, { backgroundColor: Colors.secondary }]}>
                <Text style={styles.actionPillText}>Call</Text>
             </View>
          </TouchableOpacity>

          {/* Option 2: Grounding */}
          <TouchableOpacity style={styles.optionCard} onPress={handleGrounding} activeOpacity={0.8}>
             <View style={styles.optionLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#EBF2F9' }]}>
                   <Feather name="anchor" size={18} color={Colors.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                   <Text style={styles.optionTitle}>5-4-3-2-1 Grounding</Text>
                   <Text style={styles.optionSub}>A 2-minute exercise to feel present</Text>
                </View>
             </View>
             <View style={[styles.actionPill, { backgroundColor: Colors.primary }]}>
                <Text style={styles.actionPillText}>Start</Text>
             </View>
          </TouchableOpacity>

          {/* Option 3: Journal */}
          <TouchableOpacity style={styles.optionCard} onPress={handleJournal} activeOpacity={0.8}>
             <View style={styles.optionLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FBF0E6' }]}>
                   <Feather name="edit-3" size={18} color={Colors.accent} />
                </View>
                <View style={styles.optionTextContainer}>
                   <Text style={styles.optionTitle}>Emergency Journal</Text>
                   <Text style={styles.optionSub}>Private, safe, unanalyzed</Text>
                </View>
             </View>
             <View style={[styles.actionPill, { backgroundColor: Colors.accent }]}>
                <Text style={styles.actionPillText}>Write</Text>
             </View>
          </TouchableOpacity>

        </View>

        <View style={styles.spacer} />

        {/* FOOTER ACTIONS */}
        <View style={styles.footer}>
           <TouchableOpacity 
             onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                router.back();
             }}
             style={styles.closeBtn}
           >
              <Text style={styles.closeBtnText}>I'm feeling better</Text>
           </TouchableOpacity>
           
           <Text style={styles.disclaimer}>
              INKsight does not provide medical advice.{"\n"}
              In emergency, call 112 immediately.
           </Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  heartEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    color: '#5B7A96',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 280,
  },
  breathingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  breathingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  breathingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A0ADB8',
    textAlign: 'center',
  },
  breathingTextActive: {
    fontFamily: 'Lora_400Regular',
    fontSize: 18,
    color: Colors.primary,
  },
  optionsContainer: {
    paddingHorizontal: 24,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#2C3E50',
    marginBottom: 4,
  },
  optionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
  },
  actionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionPillText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  closeBtn: {
    padding: 12,
    marginBottom: 20,
  },
  closeBtnText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: '#7F8C8D',
  },
  disclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#A0ADB8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
