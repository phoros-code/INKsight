import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDatabase } from '../../src/utils/webSafe';
import { format, subDays, parseISO } from 'date-fns';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../src/constants/colors';
import { JournalEntry, CheckIn, PatternInsight } from '../../src/types';
import { getEntriesByRange } from '../../src/database/journalDB';
import { getCheckinsForRange } from '../../src/database/checkinDB';
import { generateWeeklyPatterns } from '../../src/services/patternEngine';

import { EmotionLineChart } from '../../src/components/insights/EmotionLineChart';
import { PatternCard } from '../../src/components/insights/PatternCard';
import { EmotionRadarChart } from '../../src/components/insights/RadarChart';

type PeriodRange = '7' | '30' | '90';

export default function InsightsDashboard() {
  const router = useRouter();
  const db = useDatabase();
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<PeriodRange>('7');

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  
  const [chartData, setChartData] = useState<{ date: string; score: number }[]>([]);
  const [topEmotions, setTopEmotions] = useState<{ emotion: string; percentage: number; color: string }[]>([]);
  const [linguisticMetrics, setLinguisticMetrics] = useState({
    vocab: 0, selfFocus: 0, absolute: 0, consistency: 0
  });
  const [sleepMoodDiff, setSleepMoodDiff] = useState<{ good: number, bad: number, diff: number } | null>(null);

  const fetchData = async () => {
    try {
      const today = new Date();
      const startDate = subDays(today, parseInt(range) - 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const rawEntries = await getEntriesByRange(db, startDate, endDate);
      const rawCheckins = await getCheckinsForRange(db, startDate, endDate);

      setEntries(rawEntries as any[]); // type cast due to json parsing complexity difference in raw vs parsed
      setCheckins(rawCheckins);

      // 1. Process Chart Data
      // Map entries to daily scores. If multiple per day, average them.
      const dailyMap: Record<string, number[]> = {};
      rawEntries.forEach(e => {
        const dateKey = e.date.split('T')[0]; // YYYY-MM-DD
        if (e.moodScore) {
           if (!dailyMap[dateKey]) dailyMap[dateKey] = [];
           dailyMap[dateKey].push(e.moodScore);
        }
      });

      // Format for Victory
      const newChartData = [];
      for (let i = parseInt(range) - 1; i >= 0; i--) {
        const d = subDays(today, i);
        const dateKey = d.toISOString().split('T')[0];
        const scores = dailyMap[dateKey];
        if (scores) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          newChartData.push({ 
            date: range === '7' ? format(d, 'E') : format(d, 'M/d'), 
            score: avg 
          });
        }
      }
      setChartData(newChartData.length > 0 ? newChartData : []);

      // 2. Emotion Distribution
      const emotionCounts: Record<string, { count: number, color: string }> = {};
      let totalEmotions = 0;
      rawEntries.forEach(e => {
        if (e.dominantEmotion) {
          totalEmotions++;
          const name = e.dominantEmotion.emotion;
          if (!emotionCounts[name]) emotionCounts[name] = { count: 0, color: e.dominantEmotion.color };
          emotionCounts[name].count++;
        }
      });

      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([name, data]) => ({
          emotion: name,
          percentage: Math.round((data.count / totalEmotions) * 100),
          color: data.color
        }));
      setTopEmotions(sortedEmotions);

      // 3. Linguistic Health
      if (rawEntries.length > 0) {
        let vocabSum = 0, firstPersonSum = 0, absoluteSum = 0;
        let entriesWithLinguistics = 0;
        
        rawEntries.forEach(e => {
          if (e.linguisticScore) {
            vocabSum += e.linguisticScore.vocabularyScore || 0;
            firstPersonSum += e.linguisticScore.pronounDensity || 0;
            absoluteSum += e.linguisticScore.absoluteLanguage || 0;
            entriesWithLinguistics++;
          }
        });

        setLinguisticMetrics({
          vocab: entriesWithLinguistics ? (vocabSum / entriesWithLinguistics) * 100 : 0,
          selfFocus: entriesWithLinguistics ? (firstPersonSum / entriesWithLinguistics) * 100 : 0,
          absolute: entriesWithLinguistics ? (absoluteSum / entriesWithLinguistics) * 100 : 0,
          consistency: (rawEntries.length / parseInt(range)) * 100
        });
      } else {
        setLinguisticMetrics({ vocab: 0, selfFocus: 0, absolute: 0, consistency: 0 });
      }

      // 4. Generate AI Patterns via local engine
      if (rawEntries.length > 0) {
        const generatedPatterns = generateWeeklyPatterns(rawEntries, rawCheckins);
        setPatterns(generatedPatterns);
      } else {
        setPatterns([]);
      }

      // 5. Sleep-Mood Link
      if (rawCheckins.length > 0 && rawEntries.length > 0) {
        let gScore = 0, gCount = 0;
        let pScore = 0, pCount = 0;

        rawEntries.forEach(entry => {
          if (!entry.moodScore) return;
          const checkin = rawCheckins.find(c => c.date === entry.date.split('T')[0]);
          if (checkin) {
            if (checkin.sleepQuality && checkin.sleepQuality >= 4) { gScore += entry.moodScore; gCount++; }
            else if (checkin.sleepQuality && checkin.sleepQuality <= 2) { pScore += entry.moodScore; pCount++; }
          }
        });

        if (gCount > 0 && pCount > 0) {
          const goodAvg = gScore / gCount;
          const poorAvg = pScore / pCount;
          setSleepMoodDiff({ good: goodAvg, bad: poorAvg, diff: goodAvg - poorAvg });
        } else {
          setSleepMoodDiff(null);
        }
      }

    } catch (e) {
      console.error('Failed to fetch insights:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [range])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Helper render for metric bars
  const renderMetricBar = (label: string, value: number, isGood: boolean) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBarContainer}>
        <View 
          style={[
            styles.metricBarFill, 
            { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: isGood ? Colors.secondary : Colors.accent }
          ]} 
        />
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* HEADER — Stitch: back arrow ← "Your Patterns" → share */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Patterns</Text>
        <TouchableOpacity onPress={() => {}}>
          <Feather name="share" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* PERIOD SELECTOR */}
      <View style={styles.periodSelector}>
        {(['7', '30', '90'] as PeriodRange[]).map((p) => (
          <TouchableOpacity 
            key={p} 
            style={[styles.periodBtn, range === p && styles.periodBtnActive]}
            onPress={() => setRange(p)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodBtnText, range === p && styles.periodBtnTextActive]}>
              {p} Days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* VIEW WEEKLY SUMMARY CARD (Only for 7 Days) */}
      {range === '7' && (
         <TouchableOpacity 
           style={styles.summaryBtn}
           onPress={() => router.push('/modals/weekly-summary')}
         >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Text style={{ fontSize: 20, marginRight: 12 }}>🌟</Text>
               <View>
                 <Text style={styles.summaryBtnTitle}>Your Week in Words</Text>
                 <Text style={styles.summaryBtnSub}>View your deep summary & share</Text>
               </View>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.primary} />
         </TouchableOpacity>
      )}

      {/* EMOTION JOURNEY CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emotional Journey</Text>
        {chartData.length >= 2 ? (
          <EmotionLineChart data={chartData} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Write more entries to see your pattern trend lines.</Text>
          </View>
        )}
      </View>

      {/* EMOTION RADAR CHART — Stitch: Emotion Mix */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emotion Mix</Text>
        <EmotionRadarChart data={
          topEmotions.length >= 3 
            ? topEmotions.map(em => ({ label: em.emotion.toUpperCase(), value: em.percentage }))
            : []
        } />
      </View>

      {/* TOP 3 EMOTIONS — Stitch: emoji + percentage + trend */}
      {topEmotions.length > 0 && (
        <View style={styles.emotionsRow}>
          {topEmotions.map((em, idx) => {
            const emojis = ['\u{1F33F}', '\u2728', '\u{1F64F}']; // 🌿 ✨ 🙏
            const trendColors = [Colors.secondary, Colors.primary, '#E07A5F'];
            return (
              <View key={idx} style={styles.emotionSquare}>
                <Text style={styles.emotionEmoji}>{emojis[idx] || '\u{1F33F}'}</Text>
                <View style={styles.emotionSquareContent}>
                  <Text style={styles.emotionSquareName}>{em.emotion}</Text>
                  <Text style={[styles.emotionSquarePercent, { color: em.color || Colors.textPrimary }]}>{em.percentage}%</Text>
                </View>
                <View style={styles.emotionTrend}>
                  <Feather name={idx < 2 ? 'trending-up' : 'trending-down'} size={14} color={trendColors[idx]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* AI PATTERN INSIGHTS LIST — Stitch: "AI Pattern Insights" */}
      {patterns.length > 0 && (
        <View style={styles.patternsSection}>
          <Text style={styles.patternsSectionTitle}>AI Pattern Insights</Text>
          {patterns.map((param, idx) => (
            <PatternCard key={idx} insight={param} />
          ))}
        </View>
      )}

      {/* LINGUISTIC HEALTH CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Language Patterns</Text>
        <Text style={styles.cardSubtitle}>The way you write reveals patterns in how you feel.</Text>

        <View style={styles.metricsContainer}>
          {/* Higher diversity = good (Green) */}
          {renderMetricBar("Emotional Vocabulary", linguisticMetrics.vocab * 3, true)} 
          {/* Moderate self focus = good */}
          {renderMetricBar("Self-Focus", linguisticMetrics.selfFocus * 2, linguisticMetrics.selfFocus < 50)}
          {/* Lower absolute = good */}
          {renderMetricBar("Absolute Language", linguisticMetrics.absolute * 4, linguisticMetrics.absolute < 20)}
          {/* Higher consistency = good */}
          {renderMetricBar("Entry Consistency", linguisticMetrics.consistency, linguisticMetrics.consistency > 50)}
        </View>
      </View>

      {/* SLEEP MOOD LINK */}
      {sleepMoodDiff && (
        <View style={[styles.card, styles.sleepCard]}>
          <Text style={styles.cardTitle}>Sleep & Mood Link</Text>
          <View style={styles.sleepDataRow}>
            <View style={styles.sleepDataCol}>
              <Text style={styles.sleepDataLabel}>Good sleep nights</Text>
              <Text style={[styles.sleepDataScore, { color: Colors.secondary }]}>
                {sleepMoodDiff.good.toFixed(1)} / 10
              </Text>
            </View>
            <View style={styles.sleepDataCol}>
               <Text style={styles.sleepDataLabel}>Poor sleep nights</Text>
               <Text style={[styles.sleepDataScore, { color: '#A0ADB8' }]}>
                 {sleepMoodDiff.bad.toFixed(1)} / 10
               </Text>
            </View>
          </View>
          <View style={styles.sleepDiffBox}>
            <Feather name="trending-up" size={16} color={Colors.secondary} />
            <Text style={styles.sleepDiffText}>
              +{((sleepMoodDiff.diff / sleepMoodDiff.bad) * 100).toFixed(0)}% mood after good sleep
            </Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 12,
  },
  periodBtn: {
    flex: 1,
    backgroundColor: '#EBF0F4',
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  periodBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#7F8C8D',
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
  },
  summaryBtn: {
    backgroundColor: '#EBF2F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D4E6F1',
  },
  summaryBtnTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  summaryBtnSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Stitch: bg-white rounded-2xl p-6 shadow-sm border border-black/5
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Stitch: font-nunito font-semibold text-base
  cardTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  cardSubtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  emptyState: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: '#A0ADB8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Stitch: Top 3 Emotions as individual cards with emoji+data+trend
  emotionsRow: {
    gap: 16,
    marginBottom: 24,
  },
  emotionSquare: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emotionEmoji: {
    fontSize: 30,
  },
  emotionSquareContent: {
    flex: 1,
  },
  emotionSquareName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  emotionSquarePercent: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  emotionTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternsSection: {
    marginBottom: 8,
  },
  patternsSectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  metricsContainer: {
    marginTop: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    width: 130, // Fixed width for alignment
  },
  metricBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0EDE8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sleepCard: {
    backgroundColor: '#FBFDFD',
  },
  sleepDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
  },
  sleepDataCol: {
    flex: 1,
  },
  sleepDataLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  sleepDataScore: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
  },
  sleepDiffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sleepDiffText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.secondary,
    marginLeft: 8,
  },
});
