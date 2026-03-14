import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface DonutChartProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export const DonutChart = ({ 
  percentage, 
  color, 
  size = 80, 
  strokeWidth = 10 
}: DonutChartProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#2A3B4E"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {/* Percentage text in center */}
      <View style={styles.centerLabel}>
        <Text style={[styles.percentText, { color }]}>{percentage}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
  },
});
