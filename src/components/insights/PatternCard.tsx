import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PatternInsight } from '../../types';
import { Colors } from '../../constants/colors';

interface PatternCardProps {
  insight: PatternInsight;
}

/**
 * Stitch ref: insights_structured_scrapbook — AI Pattern Insight Cards
 * Left colored border stripe (w-1.5), font-lora text body.
 * Colors: terracotta (#E07A5F), sage (#A3B18A)
 */
const TYPE_COLORS: Record<string, string> = {
  temporal: '#E07A5F',      // terracotta
  vocabulary: '#A3B18A',    // sage
  behavioral: Colors.primary,
  language: '#E07A5F',
};

export const PatternCard: React.FC<PatternCardProps> = ({ insight }) => {
  const accentColor = TYPE_COLORS[insight.type || 'language'] || '#E07A5F';

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={styles.message}>"{insight.message}"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Stitch: bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  // Stitch: w-1.5
  accentBar: {
    width: 6,
  },
  // Stitch: p-5 pl-7
  content: {
    flex: 1,
    paddingVertical: 20,
    paddingRight: 20,
    paddingLeft: 24,
  },
  // Stitch: font-lora text-sm leading-relaxed
  message: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 24,
  },
});
