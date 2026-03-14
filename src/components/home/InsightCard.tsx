import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PatternInsight } from '../../types';
import { Colors } from '../../constants/colors';

interface InsightCardProps {
  insight: PatternInsight | null;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  if (!insight) return null;

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Feather name="zap" size={22} color={Colors.accent} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Pattern Spotted</Text>
        <Text style={styles.message}>{insight.message}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FBF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  message: {
    fontFamily: 'Lora_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
