import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function SafeSpaceModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Breathe in...');
  const breathAnim = useRef(new Animated.Value(0.8)).current;
  const timerRef = useRef<any>(null);

  const startBreathing = () => {
    setIsBreathing(true);
    runBreathCycle();
  };

  const runBreathCycle = () => {
    // Breathe in (4s)
    setBreathPhase('Breathe in...');
    Animated.timing(breathAnim, { toValue: 1.2, duration: 4000, useNativeDriver: true }).start(() => {
      // Hold (4s)
      setBreathPhase('Hold...');
      timerRef.current = setTimeout(() => {
        // Breathe out (4s)
        setBreathPhase('Breathe out...');
        Animated.timing(breathAnim, { toValue: 0.8, duration: 4000, useNativeDriver: true }).start(() => {
          runBreathCycle(); // Loop
        });
      }, 4000);
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const supportCards = [
    { icon: 'call' as const, title: 'iCall India Helpline', desc: 'Professional counseling support', btn: 'Call', btnColor: Colors.safeTeal, iconBg: Colors.safeTeal + '15' },
    { icon: 'anchor' as const, title: 'Grounding Technique', desc: 'Connect with the present moment', btn: 'Start', btnColor: Colors.safeBlue, iconBg: Colors.safeBlue + '15' },
    { icon: 'edit-note' as const, title: 'Emergency Journal', desc: 'Release your thoughts safely', btn: 'Write', btnColor: Colors.safeWarm, iconBg: Colors.safeWarm + '15' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.isDark ? theme.background : '#F0F6FB' }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={Colors.safeTextMuted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safe Space</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>💙</Text>
          <Text style={styles.heroTitle}>This moment will pass.</Text>
          <Text style={styles.heroDesc}>
            You don't have to feel this alone. We're here, and so are others.
          </Text>
        </View>

        {/* Breathing Exercise */}
        <View style={styles.breathCard}>
          <View style={styles.breathCircleContainer}>
            <Animated.View style={[styles.breathCircle, { transform: [{ scale: breathAnim }] }]}>
              <Text style={styles.breathCircleText}>Breathe</Text>
            </Animated.View>
          </View>
          <Text style={styles.breathTitle}>Breathing Exercise</Text>
          <Text style={styles.breathPhase}>{isBreathing ? breathPhase : 'Breathe in...'}</Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={isBreathing ? () => { setIsBreathing(false); if(timerRef.current) clearTimeout(timerRef.current); breathAnim.setValue(0.8); } : startBreathing}
            activeOpacity={0.9}
          >
            <Text style={styles.startBtnText}>{isBreathing ? 'Stop' : 'Start Breathing'}</Text>
          </TouchableOpacity>
        </View>

        {/* Support Cards */}
        <View style={styles.supportSection}>
          <Text style={styles.supportLabel}>IMMEDIATE SUPPORT</Text>
          {supportCards.map((card, i) => (
            <View key={i} style={styles.supportCard}>
              <View style={styles.supportCardLeft}>
                <View style={[styles.supportIcon, { backgroundColor: card.iconBg }]}>
                  <MaterialIcons name={card.icon} size={20} color={card.btnColor} />
                </View>
                <View>
                  <Text style={styles.supportTitle}>{card.title}</Text>
                  <Text style={styles.supportDesc}>{card.desc}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.supportBtn, { backgroundColor: card.btnColor }]}
                onPress={() => {
                  if (card.btn === 'Call') Linking.openURL('tel:9152987821');
                  if (card.btn === 'Start') router.push('/modals/grounding' as any);
                  if (card.btn === 'Write') router.push('/(tabs)/journal');
                }}
              >
                <Text style={styles.supportBtnText}>{card.btn}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Feeling Better */}
        <TouchableOpacity onPress={() => router.back()} style={styles.feelingBetter}>
          <Text style={styles.feelingBetterText}>I'm feeling better</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Note: This is a safe space for support and does not replace professional medical advice. If you are in immediate physical danger, please contact local emergency services immediately.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FB',
  },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.safeTextDark, fontWeight: '700',
  },

  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
  heroEmoji: { fontSize: 48, marginBottom: 24 },
  heroTitle: { fontFamily: 'Nunito_700Bold', fontSize: 26, color: Colors.safeTextDark, textAlign: 'center', marginBottom: 8 },
  heroDesc: {
    fontFamily: 'Lora_400Regular_Italic', fontSize: 16, color: Colors.safeTextMuted,
    textAlign: 'center', maxWidth: 320, lineHeight: 26,
  },

  breathCard: {
    marginHorizontal: 16, marginTop: 24, padding: 24,
    backgroundColor: '#FFFFFF99', borderRadius: 20,
    borderWidth: 1, borderColor: '#FFFFFF66',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
    alignItems: 'center', gap: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
  },
  breathCircleContainer: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  breathCircle: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: Colors.safeTeal, opacity: 0.8,
    alignItems: 'center', justifyContent: 'center',
  },
  breathCircleText: { fontFamily: 'Inter_500Medium', fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  breathTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.safeTextDark, fontWeight: '700' },
  breathPhase: { fontFamily: 'Lora_400Regular_Italic', fontSize: 18, color: Colors.safeTeal },
  startBtn: {
    backgroundColor: Colors.safeTeal, paddingHorizontal: 40, paddingVertical: 12,
    borderRadius: 16,
    shadowColor: Colors.safeTeal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  startBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF', fontWeight: '700' },

  supportSection: { paddingHorizontal: 16, marginTop: 32, gap: 12 },
  supportLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 14, color: Colors.safeTextDark,
    letterSpacing: 1, marginBottom: 4, paddingHorizontal: 4, fontWeight: '700',
  },
  supportCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  supportCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  supportIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  supportTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.safeTextDark, fontWeight: '700' },
  supportDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.safeTextMuted, marginTop: 2 },
  supportBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8,
  },
  supportBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF', fontWeight: '700' },

  feelingBetter: { alignItems: 'center', marginTop: 32 },
  feelingBetterText: {
    fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.accent,
    textDecorationLine: 'underline', fontWeight: '700',
  },

  disclaimer: {
    marginHorizontal: 24, marginTop: 24, padding: 16,
    backgroundColor: '#FFFFFF4D', borderRadius: 12,
  },
  disclaimerText: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.safeTextMuted,
    textTransform: 'uppercase', lineHeight: 18, letterSpacing: -0.3,
  },
});
