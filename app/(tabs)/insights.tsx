import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';
import { Svg, Path, Polygon, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const TIME_PERIODS = ['7 Days', '30 Days', '90 Days'];

export default function InsightsScreen() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState('7 Days');
  const [topEmotions, setTopEmotions] = useState([
    { emoji: '🌿', name: 'Calm', pct: 42, trend: +5, color: Colors.sageMuted },
    { emoji: '✨', name: 'Joy', pct: 28, trend: +12, color: Colors.primary },
    { emoji: '🙏', name: 'Gratitude', pct: 15, trend: -2, color: Colors.terracotta },
  ]);
  const [patterns, setPatterns] = useState([
    { color: Colors.terracotta, text: 'Your reflections suggest a consistent rise in Anxiety during Sunday evenings, often correlated with thoughts about the upcoming work week.' },
    { color: Colors.sageMuted, text: 'Morning entries containing the word "quiet" are followed by significantly higher overall sentiment scores throughout the day.' },
  ]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const allEntries = webStore.getAllEntries();
      if (allEntries.length > 0) {
        const emotionCounts: Record<string, number> = {};
        allEntries.forEach(e => {
          try {
            const ems = typeof e.detected_emotions === 'string' ? JSON.parse(e.detected_emotions) : [];
            ems.forEach((em: any) => {
              const name = em.emotion || '';
              emotionCounts[name] = (emotionCounts[name] || 0) + 1;
            });
          } catch {}
        });
        const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
        if (sorted.length > 0) {
          const emojis: Record<string, string> = { calm: '🌿', content: '🌿', joyful: '✨', hopeful: '✨', peaceful: '☀️', anxious: '😰', curious: '🔍', grateful: '🙏', overwhelmed: '🌊', tired: '😴', sad: '💙', uncertain: '🤔' };
          setTopEmotions(sorted.map(([name, count], i) => ({
            emoji: emojis[name] || '✨',
            name: name.charAt(0).toUpperCase() + name.slice(1),
            pct: Math.round((count / total) * 100),
            trend: i === 0 ? 5 : i === 1 ? 12 : -2,
            color: i === 0 ? Colors.sageMuted : i === 1 ? Colors.primary : Colors.terracotta,
          })));
        }
      }
      const allPatterns = webStore.getAllPatterns();
      if (allPatterns.length > 0) {
        setPatterns(allPatterns.slice(0, 2).map((p, i) => ({
          color: i === 0 ? Colors.terracotta : Colors.sageMuted,
          text: p.message.replace(/\*\*/g, ''),
        })));
      }
    }
  }, [period]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textMain }]}>Your Patterns</Text>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="share" size={24} color={theme.textMain} />
          </TouchableOpacity>
        </View>

        {/* Time Period Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
          {TIME_PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, { backgroundColor: theme.isDark ? theme.card : Colors.accentBg }, period === p && { backgroundColor: theme.primary }]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, { color: theme.textMuted }, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Emotional Journey Chart */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF0D' : '#0000000D' }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Emotional Journey</Text>
            <View style={styles.chartRange}>
              <Text style={styles.chartRangeLabel}>Range</Text>
              <Text style={styles.chartRangeValue}>LOW — HIGH</Text>
            </View>
          </View>
          <View style={styles.chartArea}>
            <Svg width="100%" height={150} viewBox="0 0 400 150">
              <Defs>
                <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.2} />
                  <Stop offset="100%" stopColor={Colors.sageMuted} stopOpacity={0.05} />
                </LinearGradient>
                <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={Colors.primary} />
                  <Stop offset="100%" stopColor={Colors.sageMuted} />
                </LinearGradient>
              </Defs>
              <Path d="M0,120 Q50,40 100,90 T200,30 T300,100 T400,20 V150 H0 Z" fill="url(#chartFill)" />
              <Path d="M0,120 Q50,40 100,90 T200,30 T300,100 T400,20" fill="none" stroke="url(#lineGrad)" strokeWidth={3} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={styles.chartDays}>
            {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
              <Text key={d} style={styles.chartDayText}>{d}</Text>
            ))}
          </View>
        </View>

        {/* Emotion Mix Radar */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF0D' : '#0000000D' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Emotion Mix</Text>
          <View style={styles.radarContainer}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke={theme.isDark ? '#FFFFFF15' : Colors.accentBg} strokeWidth={1} />
              <Polygon points="100,60 135,80 135,120 100,140 65,120 65,80" fill="none" stroke={theme.isDark ? '#FFFFFF15' : Colors.accentBg} strokeWidth={1} />
              <Polygon points="100,40 155,75 140,130 100,160 50,120 45,70" fill={theme.primary + '4D'} stroke={theme.primary} strokeWidth={2} />
              <SvgText x={100} y={12} textAnchor="middle" fontSize={9} fill={theme.textMuted}>JOY</SvgText>
              <SvgText x={188} y={62} textAnchor="start" fontSize={9} fill={theme.textMuted}>CALM</SvgText>
              <SvgText x={188} y={145} textAnchor="start" fontSize={9} fill={theme.textMuted}>GRATITUDE</SvgText>
              <SvgText x={100} y={197} textAnchor="middle" fontSize={9} fill={theme.textMuted}>ENERGY</SvgText>
              <SvgText x={12} y={145} textAnchor="end" fontSize={9} fill={theme.textMuted}>ANXIETY</SvgText>
              <SvgText x={12} y={62} textAnchor="end" fontSize={9} fill={theme.textMuted}>SADNESS</SvgText>
            </Svg>
          </View>
        </View>

        {/* Top 3 Emotions */}
        {topEmotions.map((em, i) => (
          <View key={i} style={[styles.emotionRow, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF0D' : '#0000000D' }]}>
            <Text style={styles.emotionEmoji}>{em.emoji}</Text>
            <View style={styles.emotionInfo}>
              <Text style={[styles.emotionName, { color: theme.textMuted }]}>{em.name}</Text>
              <Text style={[styles.emotionPct, { color: theme.textMain }]}>{em.pct}%</Text>
            </View>
            <View style={[styles.trendBadge, { flexDirection: 'row', alignItems: 'center' }]}>
              <MaterialIcons
                name={em.trend >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={em.color}
              />
              <Text style={[styles.trendText, { color: em.color }]}>
                {em.trend >= 0 ? '+' : ''}{em.trend}%
              </Text>
            </View>
          </View>
        ))}

        {/* AI Pattern Insights */}
        <Text style={[styles.sectionTitle, { color: theme.textMain, marginTop: 24, paddingHorizontal: 0 }]}>AI Pattern Insights</Text>
        {patterns.map((p, i) => (
          <View key={i} style={[styles.patternCard, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF0D' : '#0000000D' }]}>
            <View style={[styles.patternStripe, { backgroundColor: p.color }]} />
            <View style={styles.patternContent}>
              <Text style={[styles.patternText, { color: theme.textMain }]}>{p.text}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 24, paddingBottom: 16,
  },
  headerBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 24, color: Colors.textDark, fontWeight: '700' },
  periodRow: { gap: 12, marginBottom: 32 },
  periodBtn: {
    height: 40, paddingHorizontal: 24, borderRadius: 20,
    backgroundColor: Colors.accentBg, alignItems: 'center', justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  periodText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textMuted, fontWeight: '700' },
  periodTextActive: { color: '#FFFFFF' },

  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: '#0000000D',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.textDark, fontWeight: '600', marginBottom: 16,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  chartRange: { alignItems: 'flex-end' },
  chartRangeLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
  chartRangeValue: { fontFamily: 'Inter_700Bold', fontSize: 10, color: Colors.primary, letterSpacing: 1, fontWeight: '700' },
  chartArea: { marginTop: 16 },
  chartDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  chartDayText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.textMuted },

  radarContainer: { alignItems: 'center', justifyContent: 'center' },

  emotionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#0000000D',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  emotionEmoji: { fontSize: 30 },
  emotionInfo: { flex: 1 },
  emotionName: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  emotionPct: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.textDark, fontWeight: '700' },
  trendBadge: { gap: 4 },
  trendText: { fontFamily: 'Inter_700Bold', fontSize: 10, fontWeight: '700' },

  patternCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1, borderColor: '#0000000D',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  patternStripe: { width: 6 },
  patternContent: { flex: 1, padding: 20 },
  patternText: { fontFamily: 'Lora_400Regular', fontSize: 14, color: Colors.textDark, lineHeight: 22 },
});
