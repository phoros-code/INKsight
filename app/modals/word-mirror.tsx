import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

const WORD_CARDS = [
  {
    word: 'Resilience',
    definition: '"The capacity to recover quickly from difficulties."',
    trend: 'up',
    intensity: 3, // 0-4 scale
    organic: true,
  },
  {
    word: 'Ambivalence',
    definition: '"Coexisting contradictory feelings toward an object."',
    trend: null,
    intensity: 1,
    organic: false,
  },
];

export default function WordMirrorModal() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background content (dimmed) */}
      <View style={styles.bgContent}>
        <View style={styles.bgHeader}>
          <MaterialIcons name="menu" size={24} color="#94A3B8" />
          <View style={styles.bgAvatar}>
            <MaterialIcons name="person" size={20} color={Colors.accent} />
          </View>
        </View>
        <Text style={styles.bgTitle}>Today's Reflection</Text>
        <Text style={styles.bgDate}>June 12, 2024</Text>
        <View style={styles.bgCard}>
          <Text style={styles.bgText}>I woke up feeling a strange mix of anticipation and calm. The morning light was soft against the walls...</Text>
        </View>
      </View>

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: theme.textMain }]}>Word Mirror ✨</Text>
          <TouchableOpacity>
            <MaterialIcons name="auto-fix-high" size={24} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>EXPLORE DEEPER</Text>

          {/* Word Cards */}
          {WORD_CARDS.map((card, i) => (
            <View key={i} style={[styles.wordCard, card.organic ? styles.wordCardOrganic : styles.wordCardAlt]}>
              <View style={styles.wordCardHeader}>
                <View>
                  <Text style={styles.wordTitle}>{card.word}</Text>
                  <Text style={styles.wordDef}>{card.definition}</Text>
                </View>
                {card.trend && (
                  <MaterialIcons name="trending-up" size={16} color={Colors.accent} />
                )}
              </View>
              {/* Intensity Scale */}
              <View style={styles.intensityScale}>
                <View style={styles.intensityLine} />
                <View style={styles.intensityDots}>
                  {[0,1,2,3,4].map(d => (
                    <View key={d} style={[
                      styles.intensityDot,
                      d === card.intensity && styles.intensityDotActive,
                      d < card.intensity && { backgroundColor: Colors.accent + '66' },
                    ]} />
                  ))}
                </View>
                <View style={styles.intensityLabels}>
                  <Text style={styles.intensityLabelText}>Subtle</Text>
                  <Text style={[styles.intensityLabelText, { color: Colors.accent, fontWeight: '700' }]}>Intense</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Core Theme */}
          <View style={styles.coreTheme}>
            <View style={styles.coreThemeIcon}>
              <MaterialIcons name="psychology" size={28} color={Colors.accent} />
            </View>
            <View style={styles.coreThemeContent}>
              <Text style={styles.coreThemeLabel}>CORE THEME</Text>
              <Text style={styles.coreThemeText}>Your recent entries suggest a strengthening pattern of emotional regulation.</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={[styles.sheetFooter, { backgroundColor: theme.card + 'CC' }]}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={() => router.back()} activeOpacity={0.9}>
            <MaterialIcons name="draw" size={20} color={theme.primaryButtonText} />
            <Text style={[styles.addBtnText, { color: theme.primaryButtonText }]}>Add to Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, maxWidth: 448, alignSelf: 'center', width: '100%' },

  bgContent: { flex: 1, padding: 24, gap: 8, opacity: 0.4 },
  bgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bgAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent + '33', alignItems: 'center', justifyContent: 'center' },
  bgTitle: { fontFamily: 'Nunito_700Bold', fontSize: 28, color: Colors.textDark, fontWeight: '700', marginTop: 16 },
  bgDate: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#94A3B8' },
  bgCard: { backgroundColor: '#FFFFFFCC', padding: 24, borderRadius: 16, marginTop: 16 },
  bgText: { fontFamily: 'Lora_400Regular', fontSize: 15, color: Colors.textDark, lineHeight: 24 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A33',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(2px)' } as any : {}),
  },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 40, borderTopRightRadius: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20,
  },
  handleRow: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 48, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  sheetTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.textDark, fontWeight: '700' },
  sheetScroll: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },

  sectionLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 12, color: '#94A3B8',
    letterSpacing: 2, marginBottom: 16, fontWeight: '700',
  },

  wordCard: { padding: 20, marginBottom: 24 },
  wordCardOrganic: {
    backgroundColor: '#FDEEE740', borderWidth: 1, borderColor: Colors.accent + '1A',
    borderRadius: 30,
  },
  wordCardAlt: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9',
    borderRadius: 30,
  },
  wordCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  wordTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textDark, fontWeight: '700' },
  wordDef: { fontFamily: 'Lora_400Regular_Italic', fontSize: 14, color: '#475569', marginTop: 4 },

  intensityScale: { marginTop: 24, position: 'relative' },
  intensityLine: {
    position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
    backgroundColor: Colors.textDark, opacity: 0.1,
  },
  intensityDots: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8,
  },
  intensityDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#FFFFFF',
  },
  intensityDotActive: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.accent, borderWidth: 4,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  intensityLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  intensityLabelText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: -0.3, fontWeight: '500' },

  coreTheme: {
    flexDirection: 'row', gap: 16, padding: 16, borderRadius: 16,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderStyle: 'dashed', borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  coreThemeIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.accent + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  coreThemeContent: { flex: 1 },
  coreThemeLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#94A3B8', letterSpacing: 1, fontWeight: '700' },
  coreThemeText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#475569', lineHeight: 20, marginTop: 4, fontWeight: '500' },

  sheetFooter: {
    padding: 24, borderTopWidth: 1, borderTopColor: '#F8FAFC',
    backgroundColor: '#FFFFFFCC',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
  },
  addBtn: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: Colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  addBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
});
