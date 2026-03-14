import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDatabase } from '../../src/utils/webSafe';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
// MMKV is native-only
const MMKV_Class = Platform.OS !== 'web' ? require('react-native-mmkv').MMKV : null;
import { format, subDays } from 'date-fns';

import { Colors } from '../../src/constants/colors';
import { JournalEntry, CheckIn, PatternInsight } from '../../src/types';
import { getEntryByDate, getEntriesByRange, getStreakCount } from '../../src/database/journalDB';
import { getCheckinByDate } from '../../src/database/checkinDB';

import { EmotionPill } from '../../src/components/ui/EmotionPill';
import { MoodOrb } from '../../src/components/home/MoodOrb';
import { WeekStrip } from '../../src/components/home/WeekStrip';
import { InsightCard } from '../../src/components/home/InsightCard';

const storage = MMKV_Class ? new MMKV_Class() : { getString: () => null, getBoolean: () => false, set: () => {} };

export default function HomeDashboard() {
  const router = useRouter();
  const db = useDatabase();

  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Friend');
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null);
  const [weekEntries, setWeekEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [latestInsight, setLatestInsight] = useState<PatternInsight | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<CheckIn | null>(null);

  const fetchDashboardData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const weekAgoStr = subDays(new Date(), 6).toISOString().split('T')[0];

      // Parallel fetches
      const [entry, entries, currentStreak, checkin] = await Promise.all([
        getEntryByDate(db, todayStr),
        getEntriesByRange(db, weekAgoStr, todayStr),
        getStreakCount(db),
        getCheckinByDate(db, todayStr)
      ]);

      setTodayEntry(entry);
      setWeekEntries(entries);
      setStreak(currentStreak);
      setTodayCheckin(checkin);

      // Fetch Latest Insight (assuming recent one)
      const insightRow = await db.getFirstAsync<any>(
        'SELECT * FROM pattern_insights ORDER BY id DESC LIMIT 1'
      );
      if (insightRow) {
        setLatestInsight({
          type: insightRow.insight_type,
          message: insightRow.message,
          trend: 'stable',
          date: insightRow.generated_at
        } as PatternInsight);
      } else {
        setLatestInsight(null);
      }

      // User name from MMKV
      const storedName = storage.getString('user_name');
      if (storedName) setUserName(storedName);

    } catch (e) {
      console.error('Error fetching dashboard data', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '☁️' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' };
    if (hour < 21) return { text: 'Good evening', emoji: '🌅' };
    return { text: 'Good night', emoji: '🌙' };
  };

  const greeting = getGreeting();
  const orbColor = todayEntry?.dominantEmotion?.color || Colors.emotionNeutral;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greetingTitle}>
            {greeting.text}, {userName} {greeting.emoji}
          </Text>
          <Text style={styles.dateSubtext}>
            {format(new Date(), 'EEEE, MMM do')} • Day {streak} of reflecting
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/modals/safe-space')} style={{ marginRight: 16 }}>
            <Feather name="heart" size={24} color="#A0ADB8" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* MOOD ORB CARD */}
      <TouchableOpacity 
        style={styles.moodCard} 
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/journal')}
      >
        <View style={styles.moodOrbContainer}>
          <MoodOrb size={60} color={orbColor} />
        </View>
        <View style={styles.moodTextContainer}>
          {todayEntry ? (
            <>
              <Text style={styles.moodLabel}>Today's Energy</Text>
              <Text style={styles.moodName}>{todayEntry.dominantEmotion?.emotion || 'Mixed'}</Text>
              <Text style={styles.moodCount}>{todayEntry.detectedEmotions?.length || 0} emotions detected</Text>
              <View style={styles.pillRow}>
                {todayEntry.detectedEmotions?.slice(0, 3).map((e, i) => (
                  <EmotionPill key={i} emotion={e.emotion} color={e.color} />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyMood}>
              <Text style={styles.emptyMoodText}>Tap to start today's reflection</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* QUICK JOURNAL BUTTON */}
      <TouchableOpacity 
        style={styles.quickJournalBtn}
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/journal')}
      >
        <Feather name="edit-3" size={28} color="#FFFFFF" />
        <Text style={styles.quickJournalText}>Write in your journal</Text>
        <Feather name="chevron-right" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 7-DAY WEEK STRIP */}
      <WeekStrip 
        entries={weekEntries} 
        onDayPress={(date) => console.log('Go to history for', date)} 
        onViewAllPress={() => console.log('Go to all history')} 
      />

      {/* PATTERN INSIGHT */}
      {latestInsight && <InsightCard insight={latestInsight} />}

      {/* DAILY CHECKIN NUDGE */}
      {!todayCheckin && (
        <View style={styles.checkinCard}>
          <Text style={styles.checkinText}>30-second check-in?</Text>
          <TouchableOpacity 
            style={styles.checkinBtn}
            onPress={() => {
              // Later we will build the modal overlay
              // router.push('/modals/daily-checkin')
            }}
          >
            <Text style={styles.checkinBtnText}>Yes, quick!</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingBottom: 120, // space for floating tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerText: {
    flex: 1,
  },
  greetingTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  dateSubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  avatarText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  moodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  moodOrbContainer: {
    marginRight: 20,
  },
  moodTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  moodLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  moodName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  moodCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.secondary,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyMood: {
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyMoodText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickJournalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary, // Mocking gradient with flat color for safety, can be upgraded
    height: 68,
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  quickJournalText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  checkinCard: {
    backgroundColor: '#EDF8F4',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkinText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  checkinBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  checkinBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
