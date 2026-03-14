import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDatabase } from '../../src/utils/webSafe';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Colors } from '../../src/constants/colors';
import { CheckIn } from '../../src/types';
import { insertCheckin, getCheckinByDate } from '../../src/database/checkinDB';

// Energy levels per Stitch reference — battery-style icons
const ENERGY_LEVELS = [
  { label: 'Drained', icon: '🪫', value: 1 },
  { label: 'Low', icon: '🔋', value: 2 },
  { label: 'Steady', icon: '🔋', value: 3 },
  { label: 'Brisk', icon: '🔋', value: 4 },
  { label: 'Radiant', icon: '⚡', value: 5 },
];

// Focus areas per Stitch reference
const FOCUS_OPTIONS = [
  'Mindfulness',
  'Creativity',
  'Physical Health',
  'Work-Life',
];

export default function DailyCheckinModal() {
  const router = useRouter();
  const db = useDatabase();

  const [energy, setEnergy] = useState<number>(3);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [quickNote, setQuickNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const loadCheckin = async () => {
      try {
        const existing = await getCheckinByDate(db, todayStr);
        if (existing) {
          setIsUpdating(true);
          if (existing.energyLevel) setEnergy(existing.energyLevel);
          if (existing.oneWord) setQuickNote(existing.oneWord);
        }
      } catch (e) {
        console.error('Error loading checkin', e);
      }
    };
    loadCheckin();
  }, []);

  const handleEnergySelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnergy(value);
  };

  const toggleFocus = (focus: string) => {
    Haptics.selectionAsync();
    setSelectedFocus(prev =>
      prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]
    );
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const data: Partial<CheckIn> = {
        date: todayStr,
        energyLevel: energy,
        oneWord: quickNote.trim(),
        // Store focus as part of social connection field or extend schema
        socialConnection: selectedFocus.join(',') as any,
      };

      await insertCheckin(db, data);
      router.back();
    } catch (e) {
      console.error('Save error', e);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Check-In</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* MAIN HEADING */}
        <Text style={styles.heading}>How are you feeling today?</Text>
        <Text style={styles.subtitle}>Step into your INKsight journey.</Text>

        {/* ENERGY LEVEL SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>ENERGY LEVEL</Text>
          <View style={styles.energyRow}>
            {ENERGY_LEVELS.map((level) => {
              const isSelected = energy === level.value;
              return (
                <TouchableOpacity
                  key={level.value}
                  activeOpacity={0.7}
                  onPress={() => handleEnergySelect(level.value)}
                  style={styles.energyItem}
                >
                  <View style={[
                    styles.energyIconCircle,
                    isSelected && styles.energyIconCircleSelected,
                    isSelected && { borderColor: Colors.primary }
                  ]}>
                    <Text style={styles.energyIcon}>{level.icon}</Text>
                  </View>
                  <Text style={[
                    styles.energyLabel,
                    isSelected && styles.energyLabelSelected
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TODAY'S FOCUS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>TODAY'S FOCUS</Text>
          <View style={styles.focusGrid}>
            {FOCUS_OPTIONS.map((focus) => {
              const isSelected = selectedFocus.includes(focus);
              return (
                <TouchableOpacity
                  key={focus}
                  activeOpacity={0.7}
                  onPress={() => toggleFocus(focus)}
                  style={[
                    styles.focusPill,
                    isSelected && styles.focusPillSelected
                  ]}
                >
                  <Text style={[
                    styles.focusPillText,
                    isSelected && styles.focusPillTextSelected
                  ]}>
                    {focus}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* QUICK NOTE SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>QUICK NOTE</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#A0ADB8"
            value={quickNote}
            onChangeText={setQuickNote}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {isUpdating ? 'Update Check-In' : 'Save Check-In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EDE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  heading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 32,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: '#A0ADB8',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  energyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  energyItem: {
    alignItems: 'center',
    flex: 1,
  },
  energyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F2EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  energyIconCircleSelected: {
    backgroundColor: '#EBF2F9',
    borderWidth: 2,
  },
  energyIcon: {
    fontSize: 22,
  },
  energyLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#A0ADB8',
    textAlign: 'center',
  },
  energyLabelSelected: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  focusPill: {
    backgroundColor: '#F0EDE8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0DAD3',
  },
  focusPillSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  focusPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  focusPillTextSelected: {
    color: '#FFFFFF',
  },
  noteInput: {
    backgroundColor: '#F8F6F3',
    borderRadius: 14,
    padding: 16,
    minHeight: 100,
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    backgroundColor: '#2C3E50',
    width: '100%',
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
