import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmotionPillProps {
  emotion: string;
  color: string;
}

// Stitch: rounded-full bg-primary/10 px-3 py-0.5 font-nunito text-[12px] font-semibold
export const EmotionPill: React.FC<EmotionPillProps> = ({ emotion, color }) => {
  return (
    <View style={[styles.container, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.text, { color }]}>{emotion}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 9999,
    marginRight: 8,
    marginBottom: 4,
  },
  text: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
});
