import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
// MMKV handled web-safe
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { PlutchikWheel, WHEEL_SEGMENTS } from '../../src/components/ui/PlutchikWheel';
import { Colors } from '../../src/constants/colors';

const MMKV_Class = Platform.OS !== 'web' ? require('react-native-mmkv').MMKV : null;
const storage = MMKV_Class ? new MMKV_Class() : { getString: () => null, getBoolean: () => false, set: () => {} };

export default function EmotionWheelModal() {
  const router = useRouter();

  // Selected state
  const [selectedMainEmotion, setSelectedMainEmotion] = useState<{ segmentName: string, variant: string } | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);

  const handleWheelSelect = (segment: any, variantIndex: number) => {
    const variantName = segment.variants[variantIndex];
    setSelectedMainEmotion({
      segmentName: segment.name,
      variant: variantName
    });
    // Reset secondaries if base branch changes
    setSelectedSecondary([]);
  };

  const toggleSecondary = (emotion: string) => {
    Haptics.selectionAsync();
    setSelectedSecondary(prev => 
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Aggregate selections
    const finalEmotions = [];
    if (selectedMainEmotion) {
      finalEmotions.push(selectedMainEmotion.variant);
    }
    finalEmotions.push(...selectedSecondary);

    if (finalEmotions.length > 0) {
      // Pass back via MMKV temp key or context
      const existingStr = storage.getString('temp_wheel_params');
      const existingArray = existingStr ? JSON.parse(existingStr) : [];
      
      const merged = Array.from(new Set([...existingArray, ...finalEmotions]));
      storage.set('temp_wheel_params', JSON.stringify(merged));
    }

    router.back();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Derive variants for the selected segment
  const activeSegment = selectedMainEmotion 
    ? WHEEL_SEGMENTS.find(s => s.name === selectedMainEmotion.segmentName) 
    : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>What are you feeling?</Text>
        <Text style={styles.subtitle}>Tap the emotion that feels closest. Then go deeper.</Text>
      </View>

      {/* WHEEL CENTERPIECE */}
      <View style={styles.wheelContainer}>
        <PlutchikWheel 
          onEmotionSelect={handleWheelSelect} 
          selectedEmotion={selectedMainEmotion?.variant}
        />
      </View>

      {/* DYNAMIC SELECTION */}
      <View style={styles.selectionZone}>
        <Text style={styles.selectedTitle}>
          {selectedMainEmotion ? selectedMainEmotion.variant : "I feel..."}
        </Text>

        {/* SECONDARY ROW */}
        {activeSegment && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.secondaryScroll}>
            {activeSegment.variants.map((v, idx) => {
              if (v === selectedMainEmotion?.variant) return null; // hide already selected base

              const isSelected = selectedSecondary.includes(v);
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => toggleSecondary(v)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{v}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.spacer} />

      {/* BOTTOM ACTIONS */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.saveButton, !selectedMainEmotion && { opacity: 0.5 }]} 
          onPress={handleSave}
          disabled={!selectedMainEmotion}
        >
          <Text style={styles.saveButtonText}>Add to Journal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
          <Text style={styles.skipLinkText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2A3A',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: '#8AA8C4',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  selectionZone: {
    minHeight: 120,
    alignItems: 'center',
    marginTop: 20,
  },
  selectedTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  secondaryScroll: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#253447',
    borderWidth: 1,
    borderColor: '#3A4E63',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 12,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#8AA8C4',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  skipLink: {
    padding: 10,
  },
  skipLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8AA8C4',
  },
});
