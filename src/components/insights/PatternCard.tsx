import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PatternInsight } from '../../types';
import { Colors } from '../../constants/colors';

interface PatternCardProps {
  insight: PatternInsight;
}

const TYPE_COLORS: Record<string, string> = {
  temporal: Colors.accent,      // #E8A87C
  vocabulary: Colors.secondary,  // #7DBFA7
  behavioral: Colors.primary,    // #5B8DB8
  language: '#C4A4C0'            // Fear/Purple tone
};

const TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  temporal: 'clock',
  vocabulary: 'book-open',
  behavioral: 'activity',
  language: 'message-circle'
};

export const PatternCard: React.FC<PatternCardProps> = ({ insight }) => {
  const accentColor = TYPE_COLORS[insight.type || 'language'] || Colors.primary;
  const iconName = TYPE_ICONS[insight.type || 'language'] || 'zap';

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Feather name={iconName} size={14} color="#A0ADB8" />
          <Text style={styles.headerText}>INKSIGHT NOTICED</Text>
        </View>
        <Text style={styles.message}>{insight.message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#A0ADB8',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  message: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: '#5B6B78',
    lineHeight: 22,
  },
});
