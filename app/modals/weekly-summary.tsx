import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';

export default function WeeklySummaryModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const [stats, setStats] = useState({ entries: 12, words: '4.2k', avgTime: '15m' });
  const [bestSentence, setBestSentence] = useState(
    '"The stars don\'t just exist to be seen; they exist to remind us that even the smallest light matters in a vast dark sky."'
  );
  const [dominantEmotion, setDominantEmotion] = useState('Reflective');
  const [subEmotions, setSubEmotions] = useState(['Calm', 'Curious', 'Grateful']);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const entries = webStore.getAllEntries();
      const weekEntries = entries.slice(0, 7);
      const wordCount = weekEntries.reduce((sum, e) => sum + (e.word_count || 0), 0);
      setStats({
        entries: weekEntries.length,
        words: wordCount > 1000 ? `${(wordCount / 1000).toFixed(1)}k` : String(wordCount),
        avgTime: '15m',
      });
      // Find longest/best sentence
      if (weekEntries.length > 0) {
        const longest = weekEntries.reduce((best, e) =>
          (e.content?.length || 0) > (best.content?.length || 0) ? e : best
        , weekEntries[0]);
        const sentences = (longest.content || '').split(/[.!?]+/).filter(s => s.trim().length > 20);
        if (sentences.length > 0) {
          setBestSentence(`"${sentences[0].trim()}."`);
        }
      }
    }
  }, []);

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateRange = `${months[weekAgo.getMonth()]} ${weekAgo.getDate()} – ${today.getDate()}, ${today.getFullYear()}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.isDark ? theme.background : Colors.darkBg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🌟</Text>
          <Text style={styles.headerTitle}>Your Week in Words</Text>
          <Text style={styles.headerDate}>{dateRange}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: 'edit-note' as const, label: 'Entries', value: stats.entries },
            { icon: 'menu-book' as const, label: 'Words', value: stats.words },
            { icon: 'schedule' as const, label: 'Avg Time', value: stats.avgTime },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <MaterialIcons name={s.icon} size={20} color={Colors.darkUiAccent} />
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Dominant Emotion */}
        <View style={styles.darkCard}>
          <Text style={styles.darkCardLabel}>DOMINANT EMOTION</Text>
          <View style={styles.emotionRow}>
            <View style={styles.emotionOrb}>
              <Text style={styles.emotionOrbText}>84%</Text>
            </View>
            <View style={styles.emotionInfo}>
              <Text style={styles.emotionName}>{dominantEmotion}</Text>
              <View style={styles.emotionChips}>
                {subEmotions.map(e => (
                  <View key={e} style={styles.emotionChip}>
                    <Text style={styles.emotionChipText}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Best Sentence */}
        <View style={styles.darkCard}>
          <View style={styles.quoteIcon}>
            <MaterialIcons name="format-quote" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.darkCardLabel}>WEEK'S BEST SENTENCE</Text>
          <Text style={styles.quoteText}>{bestSentence}</Text>
        </View>

        {/* AI Insight */}
        <View style={[styles.darkCard, { flexDirection: 'row', overflow: 'hidden' }]}>
          <View style={styles.insightStripe} />
          <View style={styles.insightContent}>
            <View style={styles.insightHeader}>
              <MaterialIcons name="auto-awesome" size={14} color="#E8A87C" />
              <Text style={styles.insightLabel}>AI WEEKLY INSIGHT</Text>
            </View>
            <Text style={styles.insightText}>
              You've been focusing heavily on internal growth this week. Your entries suggest a transition from seeking external validation to finding peace in your personal progress. Keep exploring the theme of 'quiet resilience' that appeared on Wednesday.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.shareBtn}>
          <MaterialIcons name="share" size={18} color={Colors.darkUiAccent} />
          <Text style={styles.shareBtnText}>Share Summary</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.footerLock}>
            <MaterialIcons name="lock" size={12} color={Colors.darkUiAccent + '99'} />
            <Text style={styles.footerLockText}>Your reflections are private and encrypted.</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom gradient */}
      <View style={styles.bottomGradient} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scroll: { paddingBottom: 60 },

  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  headerEmoji: { fontSize: 28, marginBottom: 8 },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 26, color: '#FFFFFF', fontWeight: '700' },
  headerDate: { fontFamily: 'Lora_400Regular_Italic', fontSize: 14, color: Colors.darkUiAccent, marginTop: 4 },

  statsGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: Colors.darkCard, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF0D',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 10, color: Colors.darkUiAccent,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, fontWeight: '600',
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#FFFFFF', fontWeight: '700', marginTop: 4 },

  darkCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.darkCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#FFFFFF0D',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  darkCardLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 12, color: Colors.darkUiAccent,
    letterSpacing: 2, marginBottom: 16, fontWeight: '700',
  },

  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  emotionOrb: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#a855f7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20,
  },
  emotionOrbText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  emotionInfo: { flex: 1 },
  emotionName: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF', fontWeight: '700', marginBottom: 8 },
  emotionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: '#FFFFFF0D', borderRadius: 12,
    borderWidth: 1, borderColor: '#FFFFFF1A',
  },
  emotionChipText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.darkUiAccent },

  quoteIcon: { position: 'absolute', top: 12, right: 12, opacity: 0.1 },
  quoteText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 17, color: '#F1F5F9', lineHeight: 28 },

  insightStripe: { width: 6, backgroundColor: '#E8A87C', marginRight: 0 },
  insightContent: { flex: 1, paddingLeft: 20 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  insightLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#E8A87C', letterSpacing: 2, fontWeight: '700' },
  insightText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#CBD5E1', lineHeight: 22 },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 24, paddingVertical: 12,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.darkUiAccent,
  },
  shareBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: Colors.darkUiAccent, fontWeight: '700' },

  footer: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  footerLock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerLockText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.darkUiAccent + '99' },
  footerLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#EC5B13CC', fontWeight: '600' },

  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 128,
    backgroundColor: Colors.darkBg, opacity: 0.5,
    pointerEvents: 'none',
  },
});
