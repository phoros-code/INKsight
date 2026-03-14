import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

const EMOTIONS = [
  { name: 'Calm', color: '#7DBFA7' },
  { name: 'Anxious', color: '#89B4D4' },
  { name: 'Hopeful', color: '#F0C070' },
  { name: 'Empty', color: '#A8B8C8' },
  { name: 'Overwhelmed', color: '#C4A4C0' },
  { name: 'Grateful', color: '#90C49A' },
  { name: 'Tired', color: '#B8A898' },
  { name: 'Curious', color: '#7DBFA7' },
  { name: 'Sad', color: '#89ABD4' },
];

export default function EmotionCheckScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const toggle = (name: string) => {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 3 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Watercolor BG hint */}
        <View style={styles.watercolorBg} />

        <View style={styles.textSection}>
          <Text style={styles.headline}>Right now, in this moment...</Text>
          <Text style={styles.subline}>How would you describe how you feel?</Text>
        </View>

        {/* Emotion Grid */}
        <View style={styles.grid}>
          {EMOTIONS.map(em => {
            const isSelected = selected.includes(em.name);
            return (
              <TouchableOpacity
                key={em.name}
                style={[
                  styles.chip,
                  isSelected && { borderColor: em.color, backgroundColor: em.color + '15' },
                ]}
                onPress={() => toggle(em.name)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.chipText,
                  isSelected && { color: em.color },
                ]}>{em.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Text Input */}
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textarea}
            placeholder="Add more details about your mood..."
            placeholderTextColor={Colors.textMuted + '80'}
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStart} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Start Reflecting</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          <View style={[styles.dot, { backgroundColor: Colors.textMuted, opacity: 0.3 }]} />
          <View style={[styles.dot, { backgroundColor: Colors.textMuted, opacity: 0.3 }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  stepText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  watercolorBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    opacity: 0.03,
    borderRadius: 200,
  },
  textSection: {
    paddingTop: 16,
  },
  headline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
    lineHeight: 32,
  },
  subline: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 32,
  },
  chip: {
    height: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    flexGrow: 1,
    maxWidth: '32%',
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textDark,
  },
  textInputContainer: {
    marginTop: 32,
  },
  textarea: {
    width: '100%',
    height: 128,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    color: Colors.textDark,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
