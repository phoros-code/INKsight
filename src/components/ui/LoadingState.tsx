import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BreathingCircle } from './BreathingCircle';
import { Colors } from '../../constants/colors';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "thinking..." }: LoadingStateProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={styles.circleContainer}>
         <BreathingCircle size={24} color="#7DBFA7" />
      </View>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  circleContainer: {
    marginRight: 10,
  },
  text: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    color: Colors.textMuted,
  }
});
