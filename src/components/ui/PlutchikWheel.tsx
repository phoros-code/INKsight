import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface WheelSegment {
  name: string;
  colors: string[];
  variants: string[];
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { name: 'Joy', colors: ['#FDEAA8', '#F5D769', '#E8C020'], variants: ['Serenity', 'Joy', 'Ecstasy'] },
  { name: 'Trust', colors: ['#C8EAD5', '#7DBFA7', '#3A9B7A'], variants: ['Acceptance', 'Trust', 'Admiration'] },
  { name: 'Fear', colors: ['#C8DCF0', '#89ABD4', '#3A6B9B'], variants: ['Apprehension', 'Fear', 'Terror'] },
  { name: 'Surprise', colors: ['#FADEC8', '#F0A868', '#E07830'], variants: ['Distraction', 'Surprise', 'Amazement'] },
  { name: 'Sadness', colors: ['#C8D0E8', '#8899C4', '#3A4A9B'], variants: ['Pensiveness', 'Sadness', 'Grief'] },
  { name: 'Disgust', colors: ['#D8C8E8', '#A89FC4', '#6A4A9B'], variants: ['Boredom', 'Disgust', 'Loathing'] },
  { name: 'Anger', colors: ['#EAD0C0', '#D4896A', '#A84830'], variants: ['Annoyance', 'Anger', 'Rage'] },
  { name: 'Anticipation', colors: ['#D0EAD0', '#90C49A', '#409A48'], variants: ['Interest', 'Anticipation', 'Vigilance'] },
];

interface PlutchikWheelProps {
  onEmotionSelect: (segment: WheelSegment, variantIndex: number) => void;
  selectedEmotion?: string | null;
}

export const PlutchikWheel: React.FC<PlutchikWheelProps> = ({ onEmotionSelect, selectedEmotion }) => {
  const size = 300;
  const center = size / 2;
  // Radii for the 3 rings + center
  const r0 = 45;  // Inner white circle
  const r1 = 80;  // Ring 1 (mild)
  const r2 = 115; // Ring 2 (basic)
  const r3 = 145; // Ring 3 (intense)

  // Math helper for drawing SVG Arcs
  const polarToCartesian = (cx: number, cy: number, r: number, angleDegrees: number) => {
    const angleRadians = (angleDegrees - 90) * Math.PI / 180.0;
    return {
      x: cx + (r * Math.cos(angleRadians)),
      y: cy + (r * Math.sin(angleRadians))
    };
  };

  const describeArc = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
      "Z"
    ].join(" ");
  };

  const handlePress = (segment: WheelSegment, variantIndex: number) => {
    Haptics.selectionAsync();
    onEmotionSelect(segment, variantIndex);
  };

  const renderRings = () => {
    const paths = [];
    const angleStep = 360 / WHEEL_SEGMENTS.length;

    for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
      const segment = WHEEL_SEGMENTS[i];
      const startAngle = i * angleStep;
      // Add gap between petals for visual appeal
      const arcStart = startAngle + 2; 
      const arcEnd = startAngle + angleStep - 2;

      // Ring 1 (Inner, index 2 in array = intense color but we map inner->out or out->in based on Plutchik)
      // Standard Plutchik: Center is most intense. 
      // Spec variants: 0=mild, 1=basic, 2=intense. 
      // Spec radii: outer(mild) r=120-140, middle r=90-120, inner r=60-90. 
      // Our array colors: index 0 (light) -> index 2 (dark). 
      // So outer ring = index 0. Inner ring = index 2.

      const rings = [
        { radiusIn: r0, radiusOut: r1, variantIndex: 2, colorIndex: 2 }, // Intense (Inner)
        { radiusIn: r1, radiusOut: r2, variantIndex: 1, colorIndex: 1 }, // Basic (Middle)
        { radiusIn: r2, radiusOut: r3, variantIndex: 0, colorIndex: 0 }  // Mild (Outer)
      ];

      for (let r = 0; r < rings.length; r++) {
        const ring = rings[r];
        const emotionName = segment.variants[ring.variantIndex];
        const isSelected = selectedEmotion === emotionName;
        const fill = segment.colors[ring.colorIndex];
        
        // Very basic scale simulation using stroke for "selected" state since 
        // true reanimated SVG transforms require complex matrix math per sector.
        const stroke = isSelected ? '#FFFFFF' : fill;
        const strokeWidth = isSelected ? 3 : 1;
        const opacity = (!selectedEmotion || isSelected) ? 1 : 0.4;

        paths.push(
          <Path
            key={`${segment.name}-${r}`}
            d={describeArc(center, center, ring.radiusIn, ring.radiusOut, arcStart, arcEnd)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            onPress={() => handlePress(segment, ring.variantIndex)}
          />
        );
      }
    }
    return paths;
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {renderRings()}
          {/* Center White Circle */}
          <Circle cx={center} cy={center} r={r0 - 2} fill="#1E2A3A" />
        </G>
      </Svg>
      {/* Center Label Overlay */}
      <View style={styles.centerLabelContainer} pointerEvents="none">
         <Text style={styles.centerText} numberOfLines={1} adjustsFontSizeToFit>
           {selectedEmotion ? selectedEmotion : 'Base'}
         </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 300,
  },
  centerLabelContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    maxWidth: 80,
    textAlign: 'center',
  },
});
