import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmotionPillProps {
  emotion: string;
  color: string;
}

export const EmotionPill: React.FC<EmotionPillProps> = ({ emotion, color }) => {
  return (
    <View style={[styles.container, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.text, { color }]}>{emotion}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
