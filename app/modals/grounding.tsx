import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';

const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', icon: 'eye', prompt: "Name 5 things you can SEE right now." },
  { count: 4, sense: 'TOUCH', icon: 'hand', prompt: "Name 4 things you can TOUCH." },
  { count: 3, sense: 'HEAR', icon: 'headphones', prompt: "Name 3 things you can HEAR." },
  { count: 2, sense: 'SMELL', icon: 'wind', prompt: "Name 2 things you can SMELL." },
  { count: 1, sense: 'TASTE', icon: 'coffee', prompt: "Name 1 thing you can TASTE." }
];

export default function GroundingExercise() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(5).fill(''));

  const stepData = GROUNDING_STEPS[currentStep];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Finish and return
      router.back();
    }
  };

  const handleTextChange = (text: string) => {
    const newInputs = [...inputs];
    newInputs[currentStep] = text;
    setInputs(newInputs);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* HEADER */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
             <Feather name="x" size={24} color="#A0ADB8" />
           </TouchableOpacity>
           
           <View style={styles.progressRow}>
             {[0, 1, 2, 3, 4].map(idx => (
               <View 
                 key={idx} 
                 style={[
                   styles.progressDot, 
                   idx === currentStep ? styles.progressDotActive : 
                   idx < currentStep ? styles.progressDotDone : null
                 ]} 
               >
                 <Text style={[
                   styles.progressText,
                   (idx <= currentStep) && { color: '#FFFFFF' }
                 ]}>
                   {GROUNDING_STEPS[idx].count}
                 </Text>
               </View>
             ))}
           </View>
           
           <View style={{ width: 40 }} /> {/* Spacer matching close button */}
        </View>

        {/* CONTENT */}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
           
           <Animated.View key={currentStep} entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <Feather name={stepData.icon as any} size={32} color={Colors.primary} />
              </View>
              
              <Text style={styles.promptText}>{stepData.prompt}</Text>
              
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Type here..."
                placeholderTextColor="#A0ADB8"
                value={inputs[currentStep]}
                onChangeText={handleTextChange}
                autoFocus
                textAlignVertical="top"
              />
           </Animated.View>

        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
           <TouchableOpacity 
             style={[styles.nextBtn, inputs[currentStep].trim() === '' && { opacity: 0.5 }]} 
             onPress={handleNext}
             disabled={inputs[currentStep].trim() === ''}
           >
             <Text style={styles.nextBtnText}>
                {currentStep === 4 ? "Complete" : "Next"}
             </Text>
             <Feather name={currentStep === 4 ? "check" : "chevron-right"} size={20} color="#FFFFFF" />
           </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeBtn: {
    padding: 8,
    width: 40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF2F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  progressDotDone: {
    backgroundColor: Colors.secondary,
  },
  progressText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#A0ADB8',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  promptText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 34,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    padding: 20,
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    color: '#2C3E50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bottomNav: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
