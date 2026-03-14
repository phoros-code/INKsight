import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';

const ENERGY_LEVELS = [
  { label: 'Drained', icon: 'battery-alert' as const, color: '#94A3B8', bg: '#E2E8F0' },
  { label: 'Low', icon: 'battery-2-bar' as const, color: '#FB923C', bg: '#FFF7ED' },
  { label: 'Steady', icon: 'battery-5-bar' as const, color: Colors.primary, bg: Colors.primary + '33' },
  { label: 'Brisk', icon: 'battery-full' as const, color: Colors.sage, bg: Colors.sage + '15' },
  { label: 'Radiant', icon: 'bolt' as const, color: '#CA8A04', bg: '#FEF9C3' },
];

const FOCUS_OPTIONS = ['Mindfulness', 'Creativity', 'Physical Health', 'Work-Life'];

export default function DailyCheckinModal() {
  const router = useRouter();
  const [energy, setEnergy] = useState(2); // index
  const [focus, setFocus] = useState('Creativity');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (Platform.OS === 'web') {
      webStore.insertCheckIn({
        date: new Date().toISOString().split('T')[0],
        sleep_quality: energy + 1,
        energy_level: energy + 1,
        focus,
        quick_note: note,
        created_at: new Date().toISOString(),
      });
    }
    setSaved(true);
    setTimeout(() => router.back(), 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Check-In</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>How are you feeling today?</Text>
          <Text style={styles.questionSub}>Step into your INKsight journey.</Text>
        </View>

        {/* Energy Level */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>ENERGY LEVEL</Text>
          <View style={styles.energyRow}>
            {ENERGY_LEVELS.map((e, i) => {
              const isActive = i === energy;
              return (
                <TouchableOpacity key={i} style={styles.energyItem} onPress={() => setEnergy(i)}>
                  <View style={[
                    styles.energyCircle,
                    { backgroundColor: e.bg },
                    isActive && { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: e.color },
                  ]}>
                    <MaterialIcons name={e.icon} size={isActive ? 32 : 28} color={e.color} />
                  </View>
                  <Text style={[
                    styles.energyLabel,
                    isActive && { color: e.color, fontWeight: '700', fontSize: 13 },
                  ]}>{e.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Focus Section */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>TODAY'S FOCUS</Text>
          <View style={styles.focusRow}>
            {FOCUS_OPTIONS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.focusChip, focus === f && styles.focusChipActive]}
                onPress={() => setFocus(f)}
              >
                <Text style={[styles.focusChipText, focus === f && styles.focusChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>QUICK NOTE</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.textDark + '66'}
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved!' : 'Save Check-In'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, maxWidth: 448, alignSelf: 'center', width: '100%' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 24,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF80', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textDark, fontWeight: '700' },

  scroll: { paddingHorizontal: 24, paddingBottom: 120, gap: 32 },

  questionSection: { alignItems: 'center', gap: 8 },
  questionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 28, color: Colors.textDark, fontWeight: '700', textAlign: 'center' },
  questionSub: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.primary, fontWeight: '500' },

  glassCard: {
    backgroundColor: '#FFFFFF66', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#FFFFFF4D',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
  },
  cardLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 12, color: Colors.textDark + '99',
    letterSpacing: 1.5, textAlign: 'center', marginBottom: 24, fontWeight: '700',
  },

  energyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 8 },
  energyItem: { alignItems: 'center', gap: 12 },
  energyCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  energyLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textDark, fontWeight: '600' },

  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusChip: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.primary + '33',
  },
  focusChipActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  focusChipText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textDark, fontWeight: '500' },
  focusChipTextActive: { color: '#FFFFFF' },

  noteInput: {
    backgroundColor: '#FFFFFF80', borderRadius: 12, padding: 16,
    minHeight: 100, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textDark,
    textAlignVertical: 'top',
  },

  saveBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 28,
    backgroundColor: Colors.textDark, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  saveBtnText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
});
