import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform, Modal, ScrollView } from 'react-native';
import { useDatabase, SafeHaptics as Haptics } from '../../utils/webSafe';
import { Colors } from '../../constants/colors';

// Only import BottomSheet on native
let BottomSheet: any = null;
let BottomSheetView: any = null;
let Animated: any = null;
let useSharedValue: any = null;
let useAnimatedStyle: any = null;
let withSpring: any = null;

if (Platform.OS !== 'web') {
  BottomSheet = require('@gorhom/bottom-sheet').default;
  BottomSheetView = require('@gorhom/bottom-sheet').BottomSheetView;
  const Reanimated = require('react-native-reanimated');
  Animated = Reanimated.default;
  useSharedValue = Reanimated.useSharedValue;
  useAnimatedStyle = Reanimated.useAnimatedStyle;
  withSpring = Reanimated.withSpring;
}

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

export const WordMirrorSheet: React.FC<WordMirrorSheetProps> = ({ 
  isVisible, 
  detectedWord, 
  onClose, 
  onWordSelected 
}) => {
  const db = useDatabase();
  const bottomSheetRef = useRef<any>(null);
  const [suggestions, setSuggestions] = useState<VocabularyItem[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number>(3);

  // Sync sheet visibility with prop (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (isVisible) {
      bottomSheetRef.current?.expand();
      fetchSuggestions();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible, detectedWord]);

  // Web: fetch suggestions when visible
  useEffect(() => {
    if (Platform.OS === 'web' && isVisible) {
      fetchSuggestions();
    }
  }, [isVisible, detectedWord]);

  const fetchSuggestions = async () => {
    if (!detectedWord) return;
    try {
      const results = await db.getAllAsync(
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
    if (Platform.OS !== 'web') {
      bottomSheetRef.current?.close();
    }
    onClose();
  };

  const getIntensityColor = (level: number) => {
    if (level === 1) return '#90C8B0';
    if (level === 2) return '#5B8DB8';
    return '#6A4A9B';
  };

  // Shared inner content for both web and native
  const sheetContent = (
    <View style={styles.content}>
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
          <View style={styles.gridContainer}>
            {suggestions.map((item) => {
              const isSelected = selectedWordId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.wordCard, isSelected && styles.wordCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectWord(item.id)}
                >
                  <View style={[styles.intensityDot, { backgroundColor: getIntensityColor(item.intensity) }]} />
                  <Text style={styles.richerWord}>{item.richer_word}</Text>
                  <Text style={styles.description} numberOfLines={1}>{item.description || 'A deeper feeling.'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

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
            <TouchableOpacity style={styles.keepBtn} onPress={onClose}>
               <Text style={styles.keepBtnText}>Keep original word</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
           <Text style={styles.emptyText}>Your words are already beautifully precise.</Text>
           <TouchableOpacity style={styles.keepBtn} onPress={onClose}>
               <Text style={styles.keepBtnText}>Close</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ─── WEB: Use a simple Modal overlay ───
  if (Platform.OS === 'web') {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity style={styles.webOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.webSheet}>
            <View style={styles.webHandle} />
            <ScrollView>{sheetContent}</ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  // ─── NATIVE: Use @gorhom/bottom-sheet ───
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
        {sheetContent}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 20,
  },
  wordCard: {
    width: '47%',
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
  // Web-specific styles
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  webSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '55%',
    paddingBottom: 20,
  },
  webHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4CFC9',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
});
