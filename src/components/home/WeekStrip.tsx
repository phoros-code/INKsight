import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, subDays, isSameDay } from 'date-fns';
import { JournalEntry } from '../../types';
import { Colors } from '../../constants/colors';

interface WeekStripProps {
  entries: JournalEntry[];
  onDayPress: (date: Date) => void;
  onViewAllPress: () => void;
}

export const WeekStrip: React.FC<WeekStripProps> = ({ entries, onDayPress, onViewAllPress }) => {
  const today = new Date();
  
  // Generate array of last 7 days (including today)
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  const getEntryForDate = (date: Date) => {
    return entries.find(e => isSameDay(new Date(e.date), date));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Week</Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.viewAll}>View all →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysContainer}>
        {last7Days.map((date, index) => {
          const entry = getEntryForDate(date);
          const isToday = isSameDay(date, today);
          const circleColor = entry?.dominantEmotion?.color || '#F0EDE8';
          
          return (
            <TouchableOpacity 
              key={index} 
              style={styles.dayCol}
              onPress={() => onDayPress(date)}
              activeOpacity={0.7}
            >
              <Text style={styles.dayLetter}>
                {format(date, 'EE').charAt(0)}
              </Text>
              
              <View style={[
                styles.circle, 
                { backgroundColor: circleColor },
                isToday && styles.todayCircle
              ]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  viewAll: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.primary,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    width: 36,
  },
  dayLetter: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#A0ADB8',
    marginBottom: 8,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  todayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});
