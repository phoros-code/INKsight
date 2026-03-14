/**
 * Home Dashboard — Stitch: home_dashboard_clean_spacious
 * Exact pixel-match to Stitch PNG and code.html.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../../src/constants/colors';
import { MoodOrb } from '../../src/components/home/MoodOrb';
import { WeekStrip } from '../../src/components/home/WeekStrip';
import { InsightCard } from '../../src/components/home/InsightCard';
import { DateNavigator } from '../../src/components/ui/DateNavigator';
import { webStore } from '../../src/database/webDataStore';

// Platform-safe imports
let useSQLiteContext: any = null;
let getEntryByDate: any = null;
let getLatestEntry: any = null;
let getStreakCount: any = null;
let getEntriesByRange: any = null;

if (Platform.OS !== 'web') {
  useSQLiteContext = require('expo-sqlite').useSQLiteContext;
}
// Always import these — they handle both platforms now
import {
  getEntryByDate as _getEntryByDate,
  getLatestEntry as _getLatestEntry,
  getStreakCount as _getStreakCount,
  getEntriesByRange as _getEntriesByRange,
} from '../../src/database/journalDB';
getEntryByDate = _getEntryByDate;
getLatestEntry = _getLatestEntry;
getStreakCount = _getStreakCount;
getEntriesByRange = _getEntriesByRange;

export default function HomeScreen() {
  const router = useRouter();
  const db = Platform.OS !== 'web' && useSQLiteContext ? useSQLiteContext() : null;

  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');
  const [userName, setUserName] = useState('Friend');
  const [streakCount, setStreakCount] = useState(0);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [weekEntries, setWeekEntries] = useState<any[]>([]);
  const [patternInsight, setPatternInsight] = useState<any>(null);
  const [weatherEmoji, setWeatherEmoji] = useState('☁️');

  const loadData = useCallback(async () => {
    try {
      const dateToUse = Platform.OS === 'web' ? (webStore.getSimulatedDate() || currentDate) : currentDate;

      // Greeting based on hour
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 17) setGreeting('Good afternoon');
      else setGreeting('Good evening');

      // Weather emoji
      const emojis = ['☀️', '⛅', '☁️', '🌤️'];
      setWeatherEmoji(emojis[Math.floor(Math.random() * emojis.length)]);

      // User name
      if (Platform.OS === 'web') {
        const name = localStorage.getItem('inksight_user_name');
        if (name) setUserName(name);
      }

      // Today's entry
      const entry = await getEntryByDate(db, dateToUse);
      setTodayEntry(entry);

      // Latest entry
      const latest = await getLatestEntry(db);
      setLatestEntry(latest);

      // Streak
      const streak = await getStreakCount(db);
      setStreakCount(streak);

      // Week entries (last 7 days)
      const weekStart = format(subDays(new Date(dateToUse), 6), 'yyyy-MM-dd');
      const entries = await getEntriesByRange(db, weekStart, dateToUse);
      setWeekEntries(entries);

      // Pattern insight (from webStore on web)
      if (Platform.OS === 'web') {
        const patterns = webStore.getAllPatterns();
        if (patterns.length > 0) {
          setPatternInsight({
            message: patterns[0].message,
            type: patterns[0].insight_type,
          });
        }
      }
    } catch (e) {
      console.error('Error loading home data:', e);
    }
  }, [currentDate, db]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
  };

  // Parse dominant emotion from today's entry
  const dominantEmotion = todayEntry?.dominantEmotion;
  const moodLabel = dominantEmotion
    ? `${dominantEmotion.emotion.charAt(0).toUpperCase() + dominantEmotion.emotion.slice(1)}`
    : 'Tap to start today\'s reflection';
  const emotionPills = todayEntry?.detectedEmotions?.slice(0, 3) || [];
  const emotionCount = todayEntry?.detectedEmotions?.length || 0;

  // Latest entry formatting
  const latestDate = latestEntry?.date
    ? format(new Date(latestEntry.created_at || latestEntry.date), 'EEEE, h:mm a')
    : '';
  const latestPreview = latestEntry?.content
    ? (latestEntry.content.length > 120 ? latestEntry.content.slice(0, 120) + '...' : latestEntry.content)
    : '';

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <DateNavigator currentDate={currentDate} onDateChange={handleDateChange} />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ─── HEADER: Stitch: px-6 pt-8 pb-4 ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>
              {greeting}, {userName} {weatherEmoji}
            </Text>
            <Text style={styles.headerDate}>
              {format(new Date(currentDate), 'EEEE, d MMMM')} · Day {streakCount} of reflecting
            </Text>
          </View>
          {/* Stitch: w-10 h-10 rounded-full bg-ink-teal */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* ─── MOOD ORB CARD: Stitch: h-[140px] rounded-2xl bg-white p-6 ─── */}
        <TouchableOpacity
          style={styles.moodCard}
          onPress={() => router.push('/modals/daily-checkin')}
          activeOpacity={0.9}
        >
          <View style={styles.moodCardInner}>
            <View style={styles.moodOrbWrap}>
              <MoodOrb size={60} emotion={dominantEmotion?.emotion} />
            </View>
            <View style={styles.moodInfo}>
              <Text style={styles.moodEnergyLabel}>TODAY'S ENERGY</Text>
              <Text style={styles.moodTitle}>{moodLabel}</Text>
              {emotionPills.length > 0 && (
                <View style={styles.emotionPillsRow}>
                  {emotionPills.map((em: any, i: number) => (
                    <View key={i} style={[styles.emotionPill, { backgroundColor: `${em.color}20` }]}>
                      <Text style={[styles.emotionPillText, { color: em.color }]}>{em.emotion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          {emotionCount > 0 && (
            <View style={styles.emotionCountWrap}>
              <Text style={styles.emotionCountText}>{emotionCount} emotions</Text>
              <Text style={styles.emotionCountText}>detected</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── JOURNAL BUTTON: Stitch: gradient from-ink-blue to-ink-teal rounded-[20px] py-4 ─── */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/journal')}
          activeOpacity={0.9}
          style={styles.journalBtnWrap}
        >
          <LinearGradient
            colors={['#5B8DB8', '#7DBFA7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.journalBtn}
          >
            <Feather name="edit-3" size={20} color="#FFFFFF" />
            <Text style={styles.journalBtnText}>Write in your journal</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ─── WEEK STRIP: Stitch: rounded-2xl bg-white p-6 ─── */}
        <WeekStrip entries={weekEntries} currentDate={currentDate} />

        {/* ─── PATTERN INSIGHT: Stitch: bg-orange-50 border-orange-100 rounded-2xl p-5 ─── */}
        {patternInsight && (
          <InsightCard
            title="Pattern Spotted"
            message={patternInsight.message}
          />
        )}

        {/* ─── LATEST ENTRY: Stitch: "Latest Entry" title + white card with teal left border ─── */}
        {latestEntry && (
          <View style={styles.latestSection}>
            <Text style={styles.latestTitle}>Latest Entry</Text>
            <TouchableOpacity
              style={styles.latestCard}
              onPress={() => router.push('/(tabs)/journal')}
              activeOpacity={0.9}
            >
              <Text style={styles.latestDate}>{latestDate}</Text>
              <Text style={styles.latestPreview}>{latestPreview}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? 52 : 60, // space for DateNavigator on web
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 24,
  },
  // Stitch: px-6 pt-8 pb-4
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  // Stitch: font-nunito text-[22px] font-bold text-ink-slate
  headerGreeting: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#2C3E50',
    lineHeight: 28,
  },
  // Stitch: font-lora text-[14px] text-ink-gray
  headerDate: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  // Stitch: h-10 w-10 rounded-full bg-ink-teal
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7DBFA7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  avatarText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  // Stitch: h-[140px] rounded-2xl bg-white p-6 shadow-sm
  moodCard: {
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moodCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flex: 1,
  },
  moodOrbWrap: {},
  moodInfo: {
    flex: 1,
  },
  // Stitch: font-inter text-[12px] uppercase tracking-wider text-ink-gray
  moodEnergyLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Stitch: font-nunito text-[16px] font-bold text-ink-slate
  moodTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#2C3E50',
    marginTop: 4,
  },
  emotionPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  // Stitch: rounded-full px-3 py-0.5 font-nunito text-[12px] font-semibold
  emotionPill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  emotionPillText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  // Stitch: font-inter text-[12px] text-ink-gray (emotion count)
  emotionCountWrap: {
    alignItems: 'flex-end',
  },
  emotionCountText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
  },
  // Stitch: rounded-[20px] bg-gradient-to-r from-ink-blue to-ink-teal py-4
  journalBtnWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#5B8DB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  journalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 20,
  },
  // Stitch: font-nunito text-[18px] font-semibold text-white
  journalBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  // Latest Entry section
  latestSection: {
    gap: 12,
  },
  // Stitch: font-nunito text-[16px] font-bold text-ink-slate
  latestTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#2C3E50',
  },
  // Stitch: rounded-2xl bg-white p-5 shadow-sm border-l-4 border-ink-teal
  latestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7DBFA7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Stitch: font-inter text-[12px] text-ink-gray mb-1
  latestDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  // Stitch: font-lora text-[14px] text-ink-slate
  latestPreview: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 22,
  },
});
