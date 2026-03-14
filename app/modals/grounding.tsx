import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

const SENSES = [
  { num: 5, label: 'things you can SEE', icon: 'visibility' as const, color: Colors.safeBlue },
  { num: 4, label: 'things you can TOUCH', icon: 'touch-app' as const, color: Colors.safeTeal },
  { num: 3, label: 'things you can HEAR', icon: 'hearing' as const, color: Colors.accent },
  { num: 2, label: 'things you can SMELL', icon: 'air' as const, color: '#A89FC4' },
  { num: 1, label: 'thing you can TASTE', icon: 'restaurant' as const, color: Colors.emotionJoy },
];

export default function GroundingModal() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(Array(5).fill(false));

  const toggleCheck = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    if (next[i] && i < 4) {
      setTimeout(() => setStep(i + 1), 600);
    }
  };

  const allDone = checked.every(Boolean);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.safeTextDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>5-4-3-2-1 Grounding</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          This technique helps you reconnect with the present moment through your five senses.
        </Text>

        {/* Sense Steps */}
        {SENSES.map((sense, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.senseCard,
              i <= step ? {} : { opacity: 0.4 },
              checked[i] && { borderColor: sense.color, backgroundColor: sense.color + '08' },
            ]}
            onPress={() => i <= step && toggleCheck(i)}
            activeOpacity={0.8}
            disabled={i > step}
          >
            <View style={[styles.senseIcon, { backgroundColor: sense.color + '15' }]}>
              <MaterialIcons name={sense.icon} size={24} color={sense.color} />
            </View>
            <View style={styles.senseContent}>
              <Text style={styles.senseNum}>Name {sense.num}</Text>
              <Text style={styles.senseLabel}>{sense.label}</Text>
            </View>
            <View style={[styles.checkbox, checked[i] && { backgroundColor: sense.color, borderColor: sense.color }]}>
              {checked[i] && <MaterialIcons name="check" size={14} color="#FFF" />}
            </View>
          </TouchableOpacity>
        ))}

        {allDone && (
          <View style={styles.doneCard}>
            <MaterialIcons name="spa" size={48} color={Colors.safeTeal} />
            <Text style={styles.doneTitle}>Well done 🌿</Text>
            <Text style={styles.doneDesc}>You've completed the grounding exercise. Take a moment.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.9}>
              <Text style={styles.doneBtnText}>Return to Safe Space</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F6FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 24,
  },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.safeTextDark, fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, gap: 16 },
  intro: {
    fontFamily: 'Lora_400Regular', fontSize: 15, color: Colors.safeTextMuted,
    lineHeight: 24, marginBottom: 8,
  },
  senseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  senseIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  senseContent: { flex: 1 },
  senseNum: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.safeTextDark, fontWeight: '700' },
  senseLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.safeTextMuted, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  doneCard: {
    alignItems: 'center', gap: 16, marginTop: 24, padding: 32,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  doneTitle: { fontFamily: 'Nunito_700Bold', fontSize: 24, color: Colors.safeTextDark, fontWeight: '700' },
  doneDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.safeTextMuted, textAlign: 'center' },
  doneBtn: {
    backgroundColor: Colors.safeTeal, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 20, marginTop: 8,
  },
  doneBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFF', fontWeight: '700' },
});
