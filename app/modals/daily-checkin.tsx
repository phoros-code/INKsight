import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useDatabase } from '../../src/utils/webSafe';
// Haptics: use SafeHaptics from webSafe instead
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Colors } from '../../src/constants/colors';
import { CheckIn } from '../../src/types';
import { insertCheckin, getCheckinByDate } from '../../src/database/checkinDB';

const ENERGY_ICONS = ['😴', '🥱', '😐', '🙂', '⚡'];
const SOCIAL_OPTIONS = [
  { label: 'None', value: 'none', color: '#D4E6F1' },
  { label: 'A little', value: 'little', color: '#C4D9E8' },
  { label: 'Quite a bit', value: 'quite_a_bit', color: Colors.secondary }
];

export default function DailyCheckinModal() {
  const router = useRouter();
  const db = useDatabase();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [sleep, setSleep] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [social, setSocial] = useState<string>('little');
  const [word, setWord] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Load existing data if they already checked in today
  useEffect(() => {
    const loadCheckin = async () => {
      try {
        const existing = await getCheckinByDate(db, todayStr);
        if (existing) {
          setIsUpdating(true);
          if (existing.sleepQuality) setSleep(existing.sleepQuality);
          if (existing.energyLevel) setEnergy(existing.energyLevel);
          if (existing.socialConnection) setSocial(existing.socialConnection.toString());
          if (existing.oneWord) setWord(existing.oneWord);
        }
      } catch (e) {
        console.error('Error loading checkin', e);
      }
    };
    loadCheckin();
  }, []);

  const handleEnergySelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnergy(index + 1); // 1 to 5 scale
  };

  const handleSocialSelect = (val: string) => {
    Haptics.selectionAsync();
    setSocial(val);
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const data: Partial<CheckIn> = {
        date: todayStr,
        sleepQuality: sleep,
        energyLevel: energy,
        socialConnection: social as any, // Type override since we used strings 'little'/'none' vs standard types
        oneWord: word.trim()
      };
      
      await insertCheckin(db, data);
      
      // Close sheet gracefully
      bottomSheetRef.current?.close();
      
      // Navigate back after animation 
      setTimeout(() => {
         router.back();
      }, 300);
      
    } catch (e) {
      console.error('Save error', e);
    }
  };

  const handleClose = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
       router.back();
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* Background Dimming (since expo-router handles the modal container, we provide the sheet) */}
      <TouchableOpacity 
         style={StyleSheet.absoluteFillObject} 
         activeOpacity={1} 
         onPress={() => Keyboard.dismiss()} 
      />

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['75%']} // Adjusted slightly for keyboard
        enablePanDownToClose
        onClose={() => router.back()}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="extend" // Lift up with keyboard
      >
        <BottomSheetView style={styles.contentContainer}>
          
          {/* HEADER */}
          <View style={styles.header}>
             <Feather name="clock" size={32} color={Colors.secondary} />
             <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
               <Feather name="x" size={24} color="#A0ADB8" />
             </TouchableOpacity>
          </View>
          <Text style={styles.title}>Quick Check-In</Text>
          <Text style={styles.subtitle}>30 seconds. Just today's basics.</Text>

          {/* SLEEP SLIDER */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Last night's sleep</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={0.5}
              value={sleep}
              onValueChange={setSleep}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor="#E0DAD3"
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.sliderLabels}>
               <Text style={styles.sliderLabelText}>Restless</Text>
               <Text style={styles.sliderLabelText}>Okay</Text>
               <Text style={styles.sliderLabelText}>Deep</Text>
            </View>
          </View>

          {/* ENERGY PICKER */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Energy right now</Text>
            <View style={styles.emojiRow}>
              {ENERGY_ICONS.map((emoji, idx) => {
                const isSelected = energy === (idx + 1);
                return (
                  <TouchableOpacity 
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleEnergySelect(idx)}
                    style={[
                      styles.emojiBox, 
                      isSelected && styles.emojiBoxSelected
                    ]}
                  >
                     <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SOCIAL CHIPS */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Meaningful connection today</Text>
            <View style={styles.chipRow}>
              {SOCIAL_OPTIONS.map((opt) => {
                const isSelected = social === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    onPress={() => handleSocialSelect(opt.value)}
                    style={[
                      styles.socialChip,
                      { backgroundColor: isSelected ? opt.color : '#F0EDE8' }
                    ]}
                  >
                    <Text style={[
                      styles.socialChipText, 
                      isSelected && opt.value === 'quite_a_bit' && { color: '#FFFFFF' }
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ONE WORD INPUT */}
          <View style={styles.section}>
            <Text style={styles.wordLabel}>One word for right now:</Text>
            <BottomSheetTextInput
               style={styles.textInput}
               placeholder="e.g. heavy, bright..."
               placeholderTextColor="#A0ADB8"
               value={word}
               onChangeText={setWord}
               maxLength={20}
               returnKeyType="done"
            />
          </View>

          <View style={{ flex: 1 }} />

          {/* BOTTOM ACTIONS */}
          <View style={styles.bottomActions}>
             <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
               <Text style={styles.saveBtnText}>
                 {isUpdating ? 'Update Check-In' : 'Save Check-In'}
               </Text>
             </TouchableOpacity>
             
             <TouchableOpacity style={styles.skipBtn} onPress={handleClose}>
               <Text style={styles.skipBtnText}>Skip Today</Text>
             </TouchableOpacity>
          </View>

        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Note: the background dimming is usually managed by expo-router transparent modal,
    // so this screen is transparent implicitly.
  },
  sheetBackground: {
    backgroundColor: '#F5F2EE',
    borderRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#D4CFC9',
    width: 36,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 26,
  },
  sectionLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderLabelText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#A0ADB8',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBoxSelected: {
    backgroundColor: '#EBF2F9',
    borderColor: Colors.primary,
  },
  emojiText: {
    fontSize: 24,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialChip: {
    flex: 1,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  socialChipText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: '#5B6B78',
  },
  wordLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DAD3',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    color: '#2C3E50',
  },
  bottomActions: {
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: Colors.secondary,
    width: '100%',
    height: 52,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  skipBtn: {
    padding: 10,
  },
  skipBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#A0ADB8',
  },
});
