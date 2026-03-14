import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useDatabase, SafeHaptics as Haptics } from '../../utils/webSafe';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface WordMirrorSheetProps {
  isVisible: boolean;
  detectedWord: string;
  onClose: () => void;
  onWordSelected: (newWord: string) => void;
}

interface VocabularyItem {
  id: number;
  richer_word: string;
  intensity: number;
  description: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const WordMirrorSheet: React.FC<WordMirrorSheetProps> = ({ 
  isVisible, 
  detectedWord, 
  onClose, 
  onWordSelected 
}) => {
  const db = useDatabase();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [suggestions, setSuggestions] = useState<VocabularyItem[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number>(3);

  // Sync sheet visibility with prop
  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      fetchSuggestions();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible, detectedWord]);

  const fetchSuggestions = async () => {
    if (!detectedWord) return;
    try {
      // Very basic LIKE match or exact match on basic_emotion
      const results = await db.getAllAsync<VocabularyItem>(
        'SELECT id, richer_word, intensity, description FROM emotion_vocabulary WHERE basic_emotion = ? LIMIT 6',
        [detectedWord.toLowerCase()]
      );
      setSuggestions(results);
      setSelectedWordId(null);
    } catch (e) {
      console.error('Error fetching vocabulary', e);
    }
  };

  const handleSelectWord = (id: number) => {
    Haptics.selectionAsync();
    setSelectedWordId(id);
  };

  const handleIntensitySelect = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIntensity(level);
  };

  const handleApply = () => {
    if (!selectedWordId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const word = suggestions.find(s => s.id === selectedWordId)?.richer_word;
    if (word) {
      onWordSelected(word);
    }
    bottomSheetRef.current?.close();
    onClose();
  };

  const getIntensityColor = (level: number) => {
    if (level === 1) return '#90C8B0'; // Green
    if (level === 2) return '#5B8DB8'; // Blue
    return '#6A4A9B'; // Purple
  };

  const renderWordCard = ({ item }: { item: VocabularyItem }) => {
    const isSelected = selectedWordId === item.id;
    
    // Animate scale on select
    const scale = useSharedValue(isSelected ? 1.03 : 1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(scale.value) }] }));

    return (
      <AnimatedTouchable
        style={[styles.wordCard, isSelected && styles.wordCardSelected, animatedStyle]}
        activeOpacity={0.8}
        onPress={() => handleSelectWord(item.id)}
      >
        <View style={[styles.intensityDot, { backgroundColor: getIntensityColor(item.intensity) }]} />
        <Text style={styles.richerWord}>{item.richer_word}</Text>
        <Text style={styles.description} numberOfLines={1}>{item.description || 'A deeper feeling.'}</Text>
      </AnimatedTouchable>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={['55%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        
        {/* HEADER */}
        <Text style={styles.title}>Word Mirror ✨</Text>
        <View style={styles.highlightPill}>
          <Text style={styles.highlightText}>
            You wrote: <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{detectedWord}</Text>
          </Text>
        </View>

        {/* SUGGESTIONS GRID */}
        {suggestions.length > 0 ? (
          <>
            <FlatList
              data={suggestions}
              keyExtractor={(i) => i.id.toString()}
              numColumns={2}
              renderItem={renderWordCard}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={false}
            />

            {/* INTENSITY SCALE */}
            <View style={styles.intensitySection}>
               <Text style={styles.intensityLabel}>How intense does this feel?</Text>
               <View style={styles.dotsRow}>
                 {[1, 2, 3, 4, 5].map((level) => (
                   <TouchableOpacity
                     key={level}
                     onPress={() => handleIntensitySelect(level)}
                     style={[
                       styles.intensityScaleDot,
                       { 
                         width: 4 + (level * 2), 
                         height: 4 + (level * 2),
                         borderRadius: 10,
                         backgroundColor: selectedIntensity >= level ? '#5B8DB8' : '#D4DEE8'
                       }
                     ]}
                   />
                 ))}
               </View>
               <View style={styles.scaleLabels}>
                 <Text style={styles.scaleLabelText}>gentle</Text>
                 <Text style={styles.scaleLabelText}>overwhelming</Text>
               </View>
            </View>

            {/* ACTIONS */}
            <View style={styles.bottomActions}>
              <TouchableOpacity 
                style={[styles.applyBtn, !selectedWordId && { opacity: 0.5 }]} 
                onPress={handleApply}
                disabled={!selectedWordId}
              >
                <Text style={styles.applyBtnText}>Add to Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keepBtn} onPress={() => { onClose(); bottomSheetRef.current?.close(); }}>
                 <Text style={styles.keepBtnText}>Keep original word</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>Your words are already beautifully precise.</Text>
             <TouchableOpacity style={styles.keepBtn} onPress={() => { onClose(); bottomSheetRef.current?.close(); }}>
                 <Text style={styles.keepBtnText}>Close</Text>
              </TouchableOpacity>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#D4CFC9',
    width: 36,
    height: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  highlightPill: {
    backgroundColor: '#D4E6F1',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  highlightText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    color: '#7F8C8D',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  wordCard: {
    flex: 1,
    backgroundColor: '#F8F6F3',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    margin: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 70,
    justifyContent: 'center',
  },
  wordCardSelected: {
    backgroundColor: '#EBF2F9',
    borderColor: Colors.primary,
  },
  intensityDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  richerWord: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
  },
  intensitySection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  intensityLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 20,
  },
  intensityScaleDot: {
    marginHorizontal: 4,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 180,
    marginTop: 8,
  },
  scaleLabelText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#A0ADB8',
  },
  bottomActions: {
    marginTop: 15,
    paddingBottom: 25,
    alignItems: 'center',
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    width: width - 48,
    height: 52,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  applyBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  keepBtn: {
    padding: 10,
  },
  keepBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A0ADB8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: '#A0ADB8',
    textAlign: 'center',
    marginBottom: 20,
  },
});
