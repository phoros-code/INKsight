import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Share, Alert } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore, WebJournalEntry } from '../../src/database/webDataStore';
import { useFocusEffect } from '@react-navigation/native';
import { Svg, Path, Polygon, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const TIME_PERIODS = ['7 Days', '30 Days', '90 Days'];

function getPeriodDays(period: string): number {
  return period === '7 Days' ? 7 : period === '30 Days' ? 30 : 90;
}

function getEntriesForPeriod(period: string): WebJournalEntry[] {
  const days = getPeriodDays(period);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return webStore.getEntriesByRange(
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  );
}

// Generate chart points from mood scores
function generateChartPath(entries: WebJournalEntry[], days: number, chartW: number, chartH: number): { line: string; fill: string; labels: string[] } {
  // Group entries by date bucket
  const bucketCount = days <= 7 ? 7 : days <= 30 ? 10 : 12;
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
  const today = new Date();
  const labelArr: string[] = [];
  const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = new Date(today);
    bucketStart.setDate(bucketStart.getDate() - days + Math.floor((i * days) / bucketCount));
    const bucketEnd = new Date(today);
    bucketEnd.setDate(bucketEnd.getDate() - days + Math.floor(((i + 1) * days) / bucketCount));

    if (days <= 7) {
      labelArr.push(DAYS_SHORT[bucketStart.getDay()]);
    } else if (days <= 30) {
      labelArr.push(`${MONTHS[bucketStart.getMonth()]} ${bucketStart.getDate()}`);
    } else {
      labelArr.push(`${MONTHS[bucketStart.getMonth()]} ${bucketStart.getDate()}`);
    }

    const startStr = bucketStart.toISOString().split('T')[0];
    const endStr = bucketEnd.toISOString().split('T')[0];
    entries.forEach(e => {
      if (e.date >= startStr && e.date <= endStr && e.mood_score) {
        buckets[i].push(e.mood_score);
      }
    });
  }

  // Calculate averages
  const avgScores = buckets.map(b => b.length > 0 ? b.reduce((a, v) => a + v, 0) / b.length : 5);
  
  // Build SVG path
  const padX = 20;
  const padY = 10;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;
  const stepX = innerW / (bucketCount - 1);

  const points = avgScores.map((score, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - ((score / 10) * innerH);
    return { x, y };
  });

  // Smooth curve
  let line = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + stepX * 0.4;
    const cpx2 = curr.x - stepX * 0.4;
    line += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
  }

  const fill = `${line} L${points[points.length - 1].x},${chartH} L${points[0].x},${chartH} Z`;

  return { line, fill, labels: labelArr };
}

// Compute emotion scores for radar
function computeRadarData(entries: WebJournalEntry[]): Record<string, number> {
  const axes = ['joy', 'calm', 'gratitude', 'energy', 'anxiety', 'sadness'];
  const counts: Record<string, number> = {};
  axes.forEach(a => counts[a] = 0);

  const emotionMap: Record<string, string> = {
    joyful: 'joy', cheerful: 'joy', ecstatic: 'joy', optimistic: 'joy', serene: 'joy',
    content: 'calm', peaceful: 'calm', calm: 'calm', melancholic: 'sadness',
    hopeful: 'gratitude', grateful: 'gratitude',
    curious: 'energy', brisk: 'energy', radiant: 'energy',
    anxious: 'anxiety', overwhelmed: 'anxiety', worried: 'anxiety',
    sad: 'sadness', lonely: 'sadness', gloomy: 'sadness', empty: 'sadness',
    tired: 'sadness', uncertain: 'anxiety',
  };

  entries.forEach(e => {
    try {
      const ems = typeof e.detected_emotions === 'string' ? JSON.parse(e.detected_emotions) : [];
      ems.forEach((em: any) => {
        const mapped = emotionMap[em.emotion] || null;
        if (mapped) counts[mapped]++;
      });
    } catch {}
  });

  // Normalize to 0-1
  const max = Math.max(...Object.values(counts), 1);
  const result: Record<string, number> = {};
  axes.forEach(a => result[a] = Math.max(0.15, counts[a] / max));
  return result;
}

function radarPolygon(data: Record<string, number>, cx: number, cy: number, r: number): string {
  const axes = ['joy', 'calm', 'gratitude', 'energy', 'anxiety', 'sadness'];
  return axes.map((a, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const val = data[a] || 0.15;
    const x = cx + Math.cos(angle) * r * val;
    const y = cy + Math.sin(angle) * r * val;
    return `${x},${y}`;
  }).join(' ');
}

function radarGridPolygon(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  }).join(' ');
}

export default function InsightsScreen() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState('7 Days');
  const [topEmotions, setTopEmotions] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ line: string; fill: string; labels: string[] }>({ line: '', fill: '', labels: [] });
  const [radarData, setRadarData] = useState<Record<string, number>>({});

  const loadData = useCallback(() => {
    if (Platform.OS !== 'web') return;

    const entries = getEntriesForPeriod(period);
    const days = getPeriodDays(period);

    // Chart
    const chart = generateChartPath(entries, days, 400, 150);
    setChartData(chart);

    // Radar
    setRadarData(computeRadarData(entries));

    // Top emotions
    const emotionCounts: Record<string, number> = {};
    entries.forEach(e => {
      try {
        const ems = typeof e.detected_emotions === 'string' ? JSON.parse(e.detected_emotions) : [];
        ems.forEach((em: any) => {
          const name = em.emotion || '';
          emotionCounts[name] = (emotionCounts[name] || 0) + 1;
        });
      } catch {}
    });
    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0) || 1;
    const emojis: Record<string, string> = {
      calm: '🌿', content: '🌿', joyful: '✨', hopeful: '✨', peaceful: '☀️',
      anxious: '😰', curious: '🔍', grateful: '🙏', overwhelmed: '🌊',
      tired: '😴', sad: '💙', uncertain: '🤔',
    };
    if (sorted.length > 0) {
      setTopEmotions(sorted.map(([name, count], i) => ({
        emoji: emojis[name] || '✨',
        name: name.charAt(0).toUpperCase() + name.slice(1),
        pct: Math.round((count / total) * 100),
        trend: Math.round(Math.random() * 20 - 5),
        color: i === 0 ? Colors.sageMuted : i === 1 ? Colors.primary : Colors.terracotta,
      })));
    }

    // Patterns
    const allPatterns = webStore.getAllPatterns();
    if (allPatterns.length > 0) {
      setPatterns(allPatterns.slice(0, 3).map((p, i) => ({
        color: [Colors.terracotta, Colors.sageMuted, Colors.primary][i % 3],
        text: p.message.replace(/\*\*/g, ''),
      })));
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Share handler
  const handleShare = async () => {
    const entries = getEntriesForPeriod(period);
    const emotionSummary = topEmotions.map(e => `${e.emoji} ${e.name}: ${e.pct}%`).join('\n');
    const shareText = `🌿 INKsight — My Emotional Patterns (${period})\n\n📊 Top Emotions:\n${emotionSummary}\n\n📝 ${entries.length} journal entries analyzed\n\n🔗 https://phoros-code.github.io/INKsight`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `INKsight — My Patterns (${period})`,
          text: shareText,
        });
      } catch (e: any) {
        if (e.name !== 'AbortError') copyToClipboard(shareText);
      }
    } else if (Platform.OS === 'web') {
      copyToClipboard(shareText);
    } else {
      try {
        await Share.share({ message: shareText, title: `INKsight Patterns (${period})` });
      } catch {}
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (Platform.OS === 'web') alert('Copied to clipboard! Paste anywhere to share.');
      });
    }
  };

  const RADAR_LABELS = ['Joy', 'Calm', 'Gratitude', 'Energy', 'Anxiety', 'Sadness'];
  const cx = 130, cy = 120, r = 80;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textMain }]}>Your Patterns</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
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
              <Text style={[styles.chartRangeLabel, { color: theme.textMuted }]}>Range</Text>
              <Text style={[styles.chartRangeValue, { color: theme.primary }]}>LOW — HIGH</Text>
            </View>
          </View>
          <View style={styles.chartArea}>
            <Svg width="100%" height={150} viewBox="0 0 400 150" preserveAspectRatio="xMidYMid meet">
              <Defs>
                <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.25} />
                  <Stop offset="100%" stopColor={theme.primary} stopOpacity={0.02} />
                </LinearGradient>
              </Defs>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((frac, i) => (
                <Line key={i} x1={20} y1={10 + (150 - 20) * frac} x2={380} y2={10 + (150 - 20) * frac} stroke={theme.isDark ? '#FFFFFF08' : '#0000000A'} strokeWidth={1} />
              ))}
              {chartData.fill ? <Path d={chartData.fill} fill="url(#chartFill)" /> : null}
              {chartData.line ? <Path d={chartData.line} fill="none" stroke={theme.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
            </Svg>
          </View>
          <View style={styles.chartDays}>
            {chartData.labels.map((d, i) => (
              <Text key={i} style={[styles.chartDayText, { color: theme.textMuted }]}>{d}</Text>
            ))}
          </View>
        </View>

        {/* Emotion Mix Radar */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF0D' : '#0000000D' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Emotion Mix</Text>
          <View style={styles.radarContainer}>
            <Svg width={260} height={260} viewBox="0 0 260 240">
              {/* Grid rings */}
              <Polygon points={radarGridPolygon(cx, cy, r)} fill="none" stroke={theme.isDark ? '#FFFFFF15' : '#E5E7EB'} strokeWidth={1} />
              <Polygon points={radarGridPolygon(cx, cy, r * 0.66)} fill="none" stroke={theme.isDark ? '#FFFFFF10' : '#F3F4F6'} strokeWidth={1} />
              <Polygon points={radarGridPolygon(cx, cy, r * 0.33)} fill="none" stroke={theme.isDark ? '#FFFFFF08' : '#F9FAFB'} strokeWidth={1} />
              {/* Axis lines */}
              {Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                return <Line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke={theme.isDark ? '#FFFFFF08' : '#E5E7EB'} strokeWidth={1} />;
              })}
              {/* Data polygon */}
              <Polygon points={radarPolygon(radarData, cx, cy, r)} fill={theme.primary + '33'} stroke={theme.primary} strokeWidth={2} />
              {/* Data dots */}
              {['joy', 'calm', 'gratitude', 'energy', 'anxiety', 'sadness'].map((a, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const val = radarData[a] || 0.15;
                const x = cx + Math.cos(angle) * r * val;
                const y = cy + Math.sin(angle) * r * val;
                return <Circle key={a} cx={x} cy={y} r={4} fill={theme.primary} stroke="#FFF" strokeWidth={2} />;
              })}
              {/* Labels */}
              {RADAR_LABELS.map((label, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const lx = cx + Math.cos(angle) * (r + 22);
                const ly = cy + Math.sin(angle) * (r + 22);
                const anchor = i === 0 || i === 3 ? 'middle' : i < 3 ? 'start' : 'end';
                return <SvgText key={i} x={lx} y={ly + 4} textAnchor={anchor} fontSize={11} fontWeight="600" fill={theme.textMuted}>{label.toUpperCase()}</SvgText>;
              })}
            </Svg>
          </View>
        </View>

        {/* Top Emotions */}
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
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 24, paddingBottom: 16,
  },
  headerBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 24, fontWeight: '700' },
  periodRow: { gap: 12, marginBottom: 32 },
  periodBtn: {
    height: 40, paddingHorizontal: 24, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  periodText: { fontFamily: 'Nunito_700Bold', fontSize: 14, fontWeight: '700' },
  periodTextActive: { color: '#FFFFFF' },

  sectionCard: {
    borderRadius: 16, padding: 24, marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 16,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  chartRange: { alignItems: 'flex-end' },
  chartRangeLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  chartRangeValue: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  chartArea: { marginHorizontal: -8 },
  chartDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 8 },
  chartDayText: { fontFamily: 'Inter_400Regular', fontSize: 10 },

  radarContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },

  emotionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  emotionEmoji: { fontSize: 30 },
  emotionInfo: { flex: 1 },
  emotionName: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, fontWeight: '600' },
  emotionPct: { fontFamily: 'Inter_700Bold', fontSize: 18, fontWeight: '700' },
  trendBadge: { gap: 4 },
  trendText: { fontFamily: 'Inter_700Bold', fontSize: 10, fontWeight: '700' },

  patternCard: {
    borderRadius: 16, overflow: 'hidden', flexDirection: 'row',
    marginBottom: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  patternStripe: { width: 6 },
  patternContent: { flex: 1, padding: 20 },
  patternText: { fontFamily: 'Lora_400Regular', fontSize: 14, lineHeight: 22 },
});
