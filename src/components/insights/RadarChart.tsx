import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Text as SvgText, Line } from 'react-native-svg';
import { Colors } from '../../constants/colors';

/**
 * Stitch ref: insights_structured_scrapbook — Emotion Mix Radar
 * Hexagonal radar chart showing 6 emotion axes.
 */

interface EmotionDataPoint {
  label: string;
  value: number; // 0-100
}

interface EmotionRadarChartProps {
  data: EmotionDataPoint[];
}

const SIZE = 200;
const CENTER = SIZE / 2;
const AXES = 6;
const MAX_RADIUS = 70;
const LABEL_RADIUS = 90;

const getPoint = (index: number, radius: number): [number, number] => {
  const angle = (Math.PI * 2 * index) / AXES - Math.PI / 2;
  return [
    CENTER + radius * Math.cos(angle),
    CENTER + radius * Math.sin(angle),
  ];
};

const DEFAULT_DATA: EmotionDataPoint[] = [
  { label: 'JOY', value: 40 },
  { label: 'CALM', value: 75 },
  { label: 'GRATITUDE', value: 60 },
  { label: 'ENERGY', value: 50 },
  { label: 'ANXIETY', value: 30 },
  { label: 'SADNESS', value: 20 },
];

export const EmotionRadarChart: React.FC<EmotionRadarChartProps> = ({ data }) => {
  const chartData = data.length >= 6 ? data.slice(0, 6) : DEFAULT_DATA;

  // Grid polygons
  const gridLevels = [0.4, 0.8];
  const gridPolygons = gridLevels.map(level => {
    const points = Array.from({ length: AXES }, (_, i) => 
      getPoint(i, MAX_RADIUS * level)
    );
    return points.map(p => `${p[0]},${p[1]}`).join(' ');
  });

  // Data polygon
  const dataPoints = chartData.map((d, i) => 
    getPoint(i, MAX_RADIUS * (d.value / 100))
  );
  const dataPolygon = dataPoints.map(p => `${p[0]},${p[1]}`).join(' ');

  // Axis lines
  const axisLines = Array.from({ length: AXES }, (_, i) => getPoint(i, MAX_RADIUS));

  // Labels
  const labelPositions = chartData.map((d, i) => {
    const [x, y] = getPoint(i, LABEL_RADIUS);
    return { x, y, label: d.label };
  });

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Grid lines */}
        {gridPolygons.map((points, i) => (
          <Polygon
            key={`grid-${i}`}
            points={points}
            fill="none"
            stroke="#EBF0F4"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map(([x, y], i) => (
          <Line
            key={`axis-${i}`}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="#EBF0F4"
            strokeWidth={0.5}
          />
        ))}

        {/* Data polygon */}
        <Polygon
          points={dataPolygon}
          fill="rgba(91, 141, 184, 0.25)"
          stroke={Colors.primary}
          strokeWidth={2}
        />

        {/* Labels */}
        {labelPositions.map((pos, i) => (
          <SvgText
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            fill="#7F8C8D"
            fontSize={8}
            fontFamily="Inter"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {pos.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
