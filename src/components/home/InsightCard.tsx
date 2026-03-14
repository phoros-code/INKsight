/**
 * InsightCard — Stitch: home_dashboard_clean_spacious
 * - bg-orange-50 border border-orange-100 rounded-2xl p-5 shadow-sm
 * - Icon: rounded-xl bg-primary/10, lightbulb icon
 * - Title: font-nunito text-[14px] font-bold
 * - Message: font-lora text-[13px] italic
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface InsightCardProps {
  title?: string;
  message: string;
  icon?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title = 'Pattern Spotted',
  message,
  icon,
}) => {
  if (!message) return null;

  // Strip markdown bold markers for display
  const cleanMessage = message.replace(/\*\*/g, '');

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Feather name="zap" size={20} color="#E6A87C" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>"{cleanMessage}"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Stitch: bg-orange-50 border border-orange-100 rounded-2xl p-5 shadow-sm
  card: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Stitch: rounded-xl bg-primary/10 w-10 h-10
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  // Stitch: font-nunito text-[14px] font-bold text-ink-slate
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#2C3E50',
  },
  // Stitch: font-lora text-[13px] leading-relaxed text-ink-slate/80 italic
  message: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    color: 'rgba(44, 62, 80, 0.8)',
    lineHeight: 22,
  },
});
