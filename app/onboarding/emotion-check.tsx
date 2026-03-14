import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../src/constants/colors';

// Ensure single MMKV instance
const MMKV_Class = Platform.OS !== 'web' ? require('react-native-mmkv').MMKV : null;
const storage = MMKV_Class ? new MMKV_Class() : { getString: () => null, getBoolean: () => false, set: () => {} };

const INITIAL_EMOTIONS = [
  { label: 'Calm', color: Colors.emotionCalm },
  { label: 'Anxious', color: Colors.emotionAnxious },
  { label: 'Hopeful', color: Colors.emotionHappy },
  { label: 'Empty', color: Colors.emotionNeutral },
  { label: 'Overwhelmed', color: Colors.emotionFear || '#C4A4C0' },
  { label: 'Grateful', color: Colors.softGreen },
  { label: 'Tired', color: '#B8A898' },
  { label: 'Curious', color: Colors.secondary },
  { label: 'Sad', color: Colors.emotionSad },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function EmotionCheckScreen() {
  const router = useRouter();
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [customWord, setCustomWord] = useState('');

  const toggleEmotion = (label: string) => {
    Haptics.selectionAsync();
    setSelectedEmotions(prev => 
      prev.includes(label) 
        ? prev.filter(e => e !== label)
        : [...prev, label]
    );
  };

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Save state
    const finalSet = [...selectedEmotions];
    if (customWord.trim()) finalSet.push(customWord.trim());
    
    try {
      storage.set('initial_emotions', JSON.stringify(finalSet));
      await AsyncStorage.setItem('onboarding_complete', 'true');
      
      // Navigate to main app layout
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Failed to save onboarding state', e);
    }
  };

  const renderChip = ({ item }: { item: typeof INITIAL_EMOTIONS[0] }) => {
    const isSelected = selectedEmotions.includes(item.label);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleEmotion(item.label)}
        style={[
          styles.chip,
          isSelected ? { backgroundColor: item.color, borderColor: item.color } : null
        ]}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.heading}>Right now, in this moment...</Text>
          <Text style={styles.subheading}>
            How would you describe how you feel? (Choose all that apply)
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {INITIAL_EMOTIONS.map((item) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.7}
              onPress={() => toggleEmotion(item.label)}
              style={[
                styles.chip,
                selectedEmotions.includes(item.label) ? { backgroundColor: item.color, borderColor: item.color } : null
              ]}
            >
              <Text style={[styles.chipText, selectedEmotions.includes(item.label) && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Or describe it in your own words..."
            placeholderTextColor="#A0ADB8"
            value={customWord}
            onChangeText={setCustomWord}
            returnKeyType="done"
          />
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.ctaButton} onPress={handleFinish}>
          <Text style={styles.ctaText}>Start Reflecting</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 40,
  },
  heading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subheading: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  chip: {
    width: '31%',
    backgroundColor: '#F0EDE8',
    borderWidth: 1,
    borderColor: '#E0DAD3',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#5B6B78',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DAD3',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    height: 56,
    width: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
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
