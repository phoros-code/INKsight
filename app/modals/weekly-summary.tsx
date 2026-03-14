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

  const handleShare = () => {
    if (Platform.OS !== 'web') return;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>INKsight Weekly Summary</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:ital,wght@1,400&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1E293B;background:#F8FAFC}
      .header{text-align:center;padding-bottom:24px;border-bottom:2px solid #E2E8F0;margin-bottom:32px}
      .logo{font-size:28px;font-weight:700;color:#D4956A}.logo span{color:#7DBFA7}
      .meta{font-size:14px;color:#64748B;margin-top:8px}
      .card{background:#FFFFFF;border-radius:16px;padding:24px;margin-bottom:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03)}
      .stats{display:flex;gap:16px;margin-bottom:24px}
      .stat-box{flex:1;background:#FFFFFF;padding:16px;border-radius:12px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
      .stat-label{font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;font-weight:600}
      .stat-val{font-size:24px;font-weight:700;color:#1E293B;margin-top:8px}
      .section-label{font-size:12px;font-weight:700;color:#94A3B8;letter-spacing:2px;margin-bottom:16px;text-transform:uppercase}
      .quote{font-family:'Lora',serif;font-style:italic;font-size:18px;line-height:1.6;color:#334155}
      .emotion-bignum{font-size:48px;font-weight:700;color:#6366F1}
      .emotion-name{font-size:24px;font-weight:700;color:#1E293B}
      @media print{@page{margin:15mm;size:A4}.no-print{display:none!important}}</style></head>
      <body>
        <div class="no-print" style="text-align:center;margin-bottom:24px;">
          <button onclick="window.print()" style="background:#D4956A;color:#FFF;border:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">📄 Save as PDF</button>
        </div>
        <div class="header">
          <div class="logo">INK<span>sight</span></div>
          <div class="meta">Weekly Summary • ${dateRange}</div>
        </div>
        <div class="stats">
          <div class="stat-box"><div class="stat-label">Entries</div><div class="stat-val">${stats.entries}</div></div>
          <div class="stat-box"><div class="stat-label">Words</div><div class="stat-val">${stats.words}</div></div>
          <div class="stat-box"><div class="stat-label">Avg Time</div><div class="stat-val">${stats.avgTime}</div></div>
        </div>
        <div class="card" style="display:flex;align-items:center;gap:24px;">
          <div class="emotion-bignum">84%</div>
          <div>
            <div class="section-label" style="margin-bottom:8px;">Dominant Emotion</div>
            <div class="emotion-name">${dominantEmotion}</div>
            <div style="color:#64748B;font-size:14px;margin-top:4px;">accompanied by ${subEmotions.join(', ')}</div>
          </div>
        </div>
        <div class="card">
          <div class="section-label">Week's Best Sentence</div>
          <div class="quote">${bestSentence}</div>
        </div>
        <div class="card" style="border-left:4px solid #E8A87C;">
          <div class="section-label" style="color:#E8A87C;">AI Weekly Insight</div>
          <p style="color:#475569;line-height:1.6;font-size:15px;">You've been focusing heavily on internal growth this week. Your entries suggest a transition from seeking external validation to finding peace in your personal progress. Keep exploring the theme of 'quiet resilience' that appeared on Wednesday.</p>
        </div>
        <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;">
          Generated by INKsight • phoros-code.github.io/INKsight
        </div>
      </body></html>`;

    const w = window.open('', '_blank', 'width=850,height=1100');
    if (w) { 
      w.document.write(html); 
      w.document.close(); 
      setTimeout(() => { try { w.print(); } catch {} }, 1200); 
    }
  };

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
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
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
