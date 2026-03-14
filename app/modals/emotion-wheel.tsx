import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter }
from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import { webStore } from '../../src/database/webDataStore';

const EMOTIONS = [
  { name: 'Joy', color: Colors.emotionJoy, subs: ['ecstatic', 'cheerful', 'serene', 'optimistic'] },
  { name: 'Trust', color: Colors.emotionTrust, subs: ['admiring', 'accepting', 'appreciative', 'trusting'] },
  { name: 'Fear', color: Colors.emotionFear, subs: ['anxious', 'worried', 'uneasy', 'nervous'] },
  { name: 'Surprise', color: Colors.emotionSurprise, subs: ['amazed', 'startled', 'confused', 'astonished'] },
  { name: 'Sadness', color: Colors.emotionSadness, subs: ['lonely', 'melancholic', 'empty', 'gloomy'] },
  { name: 'Disgust', color: Colors.emotionDisgust, subs: ['bored', 'averse', 'disapproving', 'repelled'] },
  { name: 'Anger', color: Colors.emotionAnger, subs: ['irritated', 'frustrated', 'hostile', 'enraged'] },
  { name: 'Anticipation', color: Colors.emotionAnticipation, subs: ['eager', 'curious', 'vigilant', 'hopeful'] },
];

export default function EmotionWheelModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selected, setSelected] = useState(4);
  const [selectedSub, setSelectedSub] = useState('melancholic');

  const currentEmotion = EMOTIONS[selected];

  const handleAddToJournal = () => {
    if (Platform.OS === 'web') {
      const emotions = [
        { emotion: selectedSub, score: 0.9, color: currentEmotion.color },
        { emotion: currentEmotion.name.toLowerCase(), score: 0.8, color: currentEmotion.color },
      ];
      try {
        localStorage.setItem('inksight_temp_emotions', JSON.stringify(emotions));
      } catch {}
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.isDark ? theme.background : Colors.darkBg }]}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.darkUiAccent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>INKsight</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headline}>What are you feeling?</Text>
        <Text style={styles.subline}>Tap the emotion that feels closest. Then go deeper.</Text>

        {/* Emotion Wheel */}
        <View style={styles.wheelContainer}>
          <View style={[styles.wheelGlow, { backgroundColor: currentEmotion.color + '33' }]} />

          <Svg width={280} height={280} viewBox="0 0 100 100" style={styles.wheelSvg}>
            {/* Outer ring */}
            {EMOTIONS.map((em, i) => (
              <Path
                key={`outer-${i}`}
                d="M50,50 L50,0 A50,50 0 0,1 85.3,14.7 Z"
                fill={em.color}
                opacity={selected === i ? 0.7 : 0.4}
                rotation={i * 45}
                origin="50, 50"
                onPress={() => setSelected(i)}
              />
            ))}
            {/* Middle ring */}
            {EMOTIONS.map((em, i) => (
              <Path
                key={`mid-${i}`}
                d="M50,50 L50,15 A35,35 0 0,1 74.7,25.3 Z"
                fill={em.color}
                opacity={0.7}
                rotation={i * 45}
                origin="50, 50"
                onPress={() => setSelected(i)}
              />
            ))}
            {/* Inner ring */}
            {EMOTIONS.map((em, i) => (
              <Path
                key={`inner-${i}`}
                d="M50,50 L50,30 A20,20 0 0,1 64.1,35.9 Z"
                fill={em.color}
                opacity={1}
                rotation={i * 45}
                origin="50, 50"
                onPress={() => setSelected(i)}
              />
            ))}
          </Svg>

          {/* Center Label */}
          <View style={styles.centerCircle}>
            <Text style={styles.centerText}>{currentEmotion.name}</Text>
          </View>
        </View>

        {/* Selected Emotion */}
        <Text style={styles.emotionLabel}>{currentEmotion.name}</Text>

        {/* Sub-emotion chips */}
        <View style={styles.subChips}>
          {currentEmotion.subs.map(sub => (
            <TouchableOpacity
              key={sub}
              style={[styles.subChip, selectedSub === sub && styles.subChipActive]}
              onPress={() => setSelectedSub(sub)}
            >
              <Text style={[styles.subChipText, selectedSub === sub && styles.subChipTextActive]}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleAddToJournal} activeOpacity={0.9}>
          <Text style={[styles.primaryBtnText, { color: theme.primaryButtonText }]}>Add to Journal</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8,
  },
  navBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#FFFFFF', fontWeight: '700' },

  scroll: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 60 },

  headline: {
    fontFamily: 'Nunito_700Bold', fontSize: 22, color: '#FFFFFF', fontWeight: '700',
    textAlign: 'center', marginBottom: 8, marginTop: 16, letterSpacing: -0.3,
  },
  subline: {
    fontFamily: 'Lora_400Regular_Italic', fontSize: 14, color: Colors.darkUiAccent,
    textAlign: 'center', marginBottom: 40,
  },

  wheelContainer: {
    width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginBottom: 48,
  },
  wheelGlow: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
  },
  wheelSvg: {
    transform: [{ rotate: '-22.5deg' }],
  },
  centerCircle: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.darkBg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  centerText: {
    fontFamily: 'Nunito_700Bold', fontSize: 10, color: Colors.darkBg, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: -0.5,
  },

  emotionLabel: {
    fontFamily: 'Nunito_700Bold', fontSize: 20, color: '#FFFFFF', fontWeight: '700', marginBottom: 24,
  },

  subChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 48, paddingHorizontal: 24 },
  subChip: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.darkUiDeep, borderWidth: 1, borderColor: '#FFFFFF0D',
  },
  subChipActive: {
    borderColor: Colors.primary + '66',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  subChipText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.darkUiAccent, fontWeight: '500' },
  subChipTextActive: { color: Colors.primary, fontWeight: '700' },

  primaryBtn: {
    width: 280, paddingVertical: 16, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', marginBottom: 24,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  primaryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  skipText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.darkUiAccent, fontWeight: '500' },
});
