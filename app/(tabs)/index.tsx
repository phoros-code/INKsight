import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';
import * as journalDB from '../../src/database/journalDB';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ORB_COLORS = ['#F5D769', '#89ABD4', '#7DBFA7', '#A89FC4', '#F0A868', '#C4A4C0', '#a5b4fc'];

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [entryCount, setEntryCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [todayMood, setTodayMood] = useState<string>('Thoughtful · Reflective');
  const [emotions, setEmotions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const count = Platform.OS === 'web' ? webStore.getEntryCount() : await journalDB.getEntryCount(null);
      setEntryCount(count);
      const s = Platform.OS === 'web' ? webStore.getStreakCount() : await journalDB.getStreakCount(null);
      setStreak(s);
      const latest: any = Platform.OS === 'web' ? webStore.getLatestEntry() : await journalDB.getLatestEntry(null);
      if (latest) {
        setLatestEntry(latest);
        const de = typeof latest.detected_emotions === 'string'
          ? JSON.parse(latest.detected_emotions)
          : (latest.detectedEmotions || latest.detected_emotions || []);
        if (Array.isArray(de) && de.length > 0) {
          setEmotions(de.slice(0, 3));
          const dominant = de[0]?.emotion || 'Reflective';
          setTodayMood(`${dominant.charAt(0).toUpperCase() + dominant.slice(1)} · Reflective`);
        }
      }
    } catch (e) {
      console.warn('HomeScreen loadData error:', e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDateStr = () => {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const formatEntryTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${m} ${ampm}`;
    } catch { return ''; }
  };

  // Theme-aware colors
  const bg = theme.background;
  const cardBg = theme.card;
  const textMain = theme.textMain;
  const textMuted = theme.textMuted;
  const primary = theme.primary;
  const isDark = theme.isDark;
  const borderColor = isDark ? '#FFFFFF0D' : '#0000000A';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: textMain }]}>{getGreeting()}, Vala ☁️</Text>
            <Text style={[styles.dateText, { color: textMuted }]}>{getDateStr()} · Day {entryCount > 0 ? entryCount : 1} of reflecting</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: primary }]}>
            <Text style={[styles.avatarText, { color: theme.primaryButtonText }]}>V</Text>
          </View>
        </View>

        {/* Today's Mood Orb Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.moodRow}>
            <View style={styles.moodOrb}>
              <View style={styles.orbInner} />
            </View>
            <View style={styles.moodInfo}>
              <Text style={[styles.moodLabel, { color: textMuted }]}>TODAY'S ENERGY</Text>
              <Text style={[styles.moodTitle, { color: textMain }]}>{todayMood}</Text>
              <View style={styles.emotionTags}>
                {emotions.slice(0, 2).map((em: any, i: number) => (
                  <View key={i} style={[styles.emotionTag, { backgroundColor: (em.color || primary) + '15' }]}>
                    <Text style={[styles.emotionTagText, { color: em.color || primary }]}>
                      {em.emotion || 'curious'}
                    </Text>
                  </View>
                ))}
                {emotions.length === 0 && (
                  <>
                    <View style={[styles.emotionTag, { backgroundColor: primary + '15' }]}>
                      <Text style={[styles.emotionTagText, { color: primary }]}>curious</Text>
                    </View>
                    <View style={[styles.emotionTag, { backgroundColor: Colors.sage + '15' }]}>
                      <Text style={[styles.emotionTagText, { color: Colors.sage }]}>calm</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            <View style={styles.emotionCount}>
              <Text style={[styles.emotionCountNum, { color: textMuted }]}>{emotions.length || 3}</Text>
              <Text style={[styles.emotionCountLabel, { color: textMuted }]}>emotions{'\n'}detected</Text>
            </View>
          </View>
        </View>

        {/* Quick Journal Button */}
        <TouchableOpacity
          style={[styles.journalBtn, { backgroundColor: primary, shadowColor: primary }]}
          onPress={() => router.push('/(tabs)/journal')}
          activeOpacity={0.9}
        >
          <MaterialIcons name="opacity" size={24} color={theme.primaryButtonText} />
          <Text style={[styles.journalBtnText, { color: theme.primaryButtonText }]}>Write in your journal</Text>
        </TouchableOpacity>

        {/* Your Week */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.weekHeader}>
            <Text style={[styles.weekTitle, { color: textMain }]}>Your Week</Text>
            <MaterialIcons name="trending-up" size={20} color={textMuted} />
          </View>
          <View style={styles.weekRow}>
            {DAYS.map((d, i) => {
              const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);
              const size = 20 + Math.random() * 28;
              return (
                <View key={i} style={styles.weekDay}>
                  {isToday ? (
                    <View style={[styles.todayOrb, { borderColor: primary }]}>
                      <View style={[styles.weekOrbInner, { backgroundColor: primary + '99' }]} />
                    </View>
                  ) : (
                    <View style={[styles.weekOrb, { width: size, height: size, borderRadius: size / 2, backgroundColor: ORB_COLORS[i] + '60' }]} />
                  )}
                  <Text style={[styles.weekDayLabel, { color: textMuted }, isToday && { color: primary, fontWeight: '700' }]}>{d}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pattern Insight */}
        <View style={[styles.insightCard, { backgroundColor: isDark ? cardBg : '#FFF7ED', borderColor: isDark ? borderColor : '#FFEDD5' }]}>
          <View style={[styles.insightIcon, { backgroundColor: primary + '15' }]}>
            <MaterialIcons name="lightbulb" size={20} color={primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: textMain }]}>Pattern Spotted</Text>
            <Text style={[styles.insightText, { color: textMain + 'CC' }]}>
              "You write more frequently on evenings after productive workdays, often expressing feelings of clarity and calm."
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.quickActionsTitle, { color: textMain }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/modals/daily-checkin' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="wb-sunny" size={22} color="#F59E0B" />
              </View>
              <Text style={[styles.quickActionLabel, { color: textMain }]}>Daily{"\n"}Check-In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/modals/emotion-wheel' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: primary + '20' }]}>
                <MaterialIcons name="donut-large" size={22} color={primary} />
              </View>
              <Text style={[styles.quickActionLabel, { color: textMain }]}>Emotion{"\n"}Wheel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/modals/safe-space' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialIcons name="favorite" size={22} color="#3B82F6" />
              </View>
              <Text style={[styles.quickActionLabel, { color: textMain }]}>Safe{"\n"}Space</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/modals/weekly-summary' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
                <MaterialIcons name="auto-awesome" size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.quickActionLabel, { color: textMain }]}>Weekly{"\n"}Summary</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Latest Entry */}
        <View style={styles.latestSection}>
          <Text style={[styles.latestTitle, { color: textMain }]}>Latest Entry</Text>
          <View style={[styles.latestCard, { backgroundColor: cardBg, borderLeftColor: primary }]}>
            <Text style={[styles.latestTime, { color: textMuted }]}>
              {latestEntry ? `Yesterday, ${formatEntryTime(latestEntry.created_at || latestEntry.createdAt)}` : 'Yesterday, 8:42 PM'}
            </Text>
            <Text style={[styles.latestText, { color: textMain }]} numberOfLines={2}>
              {latestEntry?.content || "The clouds were particularly dramatic today. I found myself thinking about the project deadline, but strangely felt at peace..."}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingBottom: 16,
  },
  greeting: { fontFamily: 'Nunito_700Bold', fontSize: 22, fontWeight: '700' },
  dateText: { fontFamily: 'Lora_400Regular', fontSize: 14, marginTop: 4 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  avatarText: { fontFamily: 'Nunito_700Bold', fontSize: 18 },

  card: {
    marginHorizontal: 24, marginTop: 16,
    borderRadius: 16, padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  moodOrb: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#a5b4fc',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#818cf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  orbInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#818cf8', opacity: 0.7 },
  moodInfo: { flex: 1 },
  moodLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  moodTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, fontWeight: '700', marginTop: 4 },
  emotionTags: { flexDirection: 'row', gap: 8, marginTop: 8 },
  emotionTag: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3 },
  emotionTagText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, fontWeight: '600' },
  emotionCount: { alignItems: 'flex-end' },
  emotionCountNum: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  emotionCountLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'right' },

  journalBtn: {
    marginHorizontal: 24, marginTop: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingVertical: 16, borderRadius: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  journalBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, fontWeight: '600' },

  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weekTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  weekDay: { alignItems: 'center', gap: 8 },
  weekOrb: {},
  todayOrb: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  weekOrbInner: { width: 32, height: 32, borderRadius: 16 },
  weekDayLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  insightCard: {
    marginHorizontal: 24, marginTop: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    borderWidth: 1, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8,
  },
  insightIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  insightContent: { flex: 1, gap: 4 },
  insightTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, fontWeight: '700' },
  insightText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 13, lineHeight: 20 },

  latestSection: { marginHorizontal: 24, marginTop: 16, gap: 12 },
  latestTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, fontWeight: '700' },
  latestCard: {
    borderRadius: 16, padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
  },
  latestTime: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 4 },
  latestText: { fontFamily: 'Lora_400Regular', fontSize: 14, lineHeight: 22 },

  quickActionsSection: { marginHorizontal: 24, marginTop: 20, gap: 12 },
  quickActionsTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, fontWeight: '700' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickActionCard: {
    width: '47%' as any, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
