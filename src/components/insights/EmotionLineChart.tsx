import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { 
  VictoryLine, 
  VictoryChart, 
  VictoryAxis, 
  VictoryScatter, 
  VictoryArea 
} from 'victory-native';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface ChartDataPoint {
  date: string; // e.g., 'Mon', '2/14'
  score: number;
}

interface EmotionLineChartProps {
  data: ChartDataPoint[];
}

export const EmotionLineChart: React.FC<EmotionLineChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      <VictoryChart 
        width={width - 40} 
        height={220}
        padding={{ top: 20, bottom: 40, left: 30, right: 30 }}
      >
        <Defs>
          <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        <VictoryAxis 
          style={{
            axis: { stroke: 'transparent' },
            ticks: { stroke: 'transparent' },
            tickLabels: { 
              fontFamily: 'Inter_400Regular', 
              fontSize: 10, 
              fill: '#A0ADB8' 
            }
          }}
          fixLabelOverlap
        />

        <VictoryArea
          data={data}
          x="date"
          y="score"
          interpolation="catmullRom"
          style={{ data: { fill: 'url(#lineGradient)' } }}
          animate={{ duration: 800, onLoad: { duration: 800 } }}
        />

        <VictoryLine
          data={data}
          x="date"
          y="score"
          interpolation="catmullRom"
          style={{
            data: { 
              stroke: Colors.primary, 
              strokeWidth: 2.5 
            }
          }}
          animate={{ duration: 800, onLoad: { duration: 800 } }}
        />

        <VictoryScatter
          data={data}
          x="date"
          y="score"
          size={4}
          style={{ data: { fill: Colors.primary } }}
          animate={{ duration: 800, onLoad: { duration: 800 } }}
        />

      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: -10, // Adjust Victory default padding
  },
});
