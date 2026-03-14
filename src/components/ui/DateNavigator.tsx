/**
 * DateNavigator — Floating dev toolbar for web testing.
 * Allows navigating through 90 days of demo data to evaluate each day.
 * Only renders on web platform.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { webStore } from '../../database/webDataStore';
import { Colors } from '../../constants/colors';

interface DateNavigatorProps {
  onDateChange: (date: string) => void;
  currentDate: string;
}

export const DateNavigator = ({ onDateChange, currentDate }: DateNavigatorProps) => {
  if (Platform.OS !== 'web') return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const minDate = format(subDays(new Date(), 89), 'yyyy-MM-dd');
  const currentParsed = parseISO(currentDate);

  const goBack = () => {
    const prev = format(subDays(currentParsed, 1), 'yyyy-MM-dd');
    if (prev >= minDate) {
      webStore.setSimulatedDate(prev);
      onDateChange(prev);
    }
  };

  const goForward = () => {
    const next = format(addDays(currentParsed, 1), 'yyyy-MM-dd');
    if (next <= today) {
      webStore.setSimulatedDate(next);
      onDateChange(next);
    }
  };

  const resetToToday = () => {
    webStore.setSimulatedDate(null);
    onDateChange(today);
  };

  const isToday = currentDate === today;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goBack} style={styles.btn}>
        <Text style={styles.btnText}>◀</Text>
      </TouchableOpacity>

      <View style={styles.dateBox}>
        <Text style={styles.dateLabel}>
          {format(currentParsed, 'EEE, MMM d')}
        </Text>
        {!isToday && (
          <Text style={styles.daysAgo}>
            {Math.round((new Date().getTime() - currentParsed.getTime()) / 86400000)}d ago
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={goForward} style={styles.btn} disabled={isToday}>
        <Text style={[styles.btnText, isToday && { opacity: 0.3 }]}>▶</Text>
      </TouchableOpacity>

      {!isToday && (
        <TouchableOpacity onPress={resetToToday} style={styles.resetBtn}>
          <Text style={styles.resetText}>Today</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44, 62, 80, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
    ...(Platform.OS === 'web' ? { position: 'fixed' as any, top: 0, left: 0, right: 0, zIndex: 9999 } : {}),
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  daysAgo: {
    color: '#7DBFA7',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  resetBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  resetText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});
