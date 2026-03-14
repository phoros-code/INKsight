/**
 * WeekStrip — Stitch: home_dashboard_clean_spacious
 * - Card: bg-white rounded-2xl p-6 shadow-sm
 * - Header: "Your Week" + trending_up icon
 * - Circles: variable size, colored by emotion, day letter below
 * - Today: border-2 border-ink-blue w-12 h-12 with orb inside
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { JournalEntry } from '../../types';

export interface WeekStripProps {
  entries: JournalEntry[];
  currentDate?: string;
  onDayPress?: (date: Date) => void;
}

// Stitch color palette for week circles
const WEEK_COLORS = ['#FDE68A', '#BFDBFE', '#7DBFA780', '#D8B4FE', '#FED7AA', '#FBCFE8'];

export const WeekStrip: React.FC<WeekStripProps> = ({ entries, currentDate, onDayPress }) => {
  const baseDate = currentDate ? parseISO(currentDate) : new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(baseDate, 6 - i));

  const getEntryForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find(e => e.date === dateStr);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Week</Text>
        <Feather name="trending-up" size={20} color="#7F8C8D" />
      </View>

      <View style={styles.daysContainer}>
        {last7Days.map((date, index) => {
          const entry = getEntryForDate(date);
          const isToday = isSameDay(date, baseDate);
          const circleColor = entry?.dominantEmotion?.color || WEEK_COLORS[index % WEEK_COLORS.length];

          // Stitch: variable sizes (h-6 w-6, h-8 w-8, h-5 w-5, h-10 w-10, etc.)
          const sizeMap = [24, 32, 20, 40, 28, 24]; // Per Stitch weekday sizes
          const size = isToday ? 48 : (entry ? sizeMap[index % sizeMap.length] : 24);
          const opacity = entry ? (isToday ? 1 : 0.7) : 0.4;

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayCol}
              onPress={() => onDayPress?.(date)}
              activeOpacity={0.7}
            >
              {isToday ? (
                // Stitch: border-2 border-ink-blue w-12 h-12 with orb-gradient inside
                <View style={styles.todayRing}>
                  <View style={[styles.todayInner, { backgroundColor: circleColor }]} />
                </View>
              ) : (
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: circleColor,
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      opacity,
                    },
                  ]}
                />
              )}
              <Text style={[styles.dayLetter, isToday && styles.dayLetterToday]}>
                {format(date, 'EE').charAt(0)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Stitch: rounded-2xl bg-white p-6 shadow-sm
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Stitch: font-nunito text-[16px] font-bold text-ink-slate
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#2C3E50',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
  },
  dayCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 8,
  },
  // Stitch: font-inter text-[11px] text-ink-gray
  dayLetter: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#7F8C8D',
  },
  dayLetterToday: {
    fontFamily: 'Inter_700Bold',
    color: '#5B8DB8',
  },
  circle: {},
  // Stitch: border-2 border-ink-blue h-12 w-12 rounded-full
  todayRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#5B8DB8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stitch: h-8 w-8 rounded-full orb-gradient
  todayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
