import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDatabase } from '../../src/utils/webSafe';
import { Feather } from '@expo/vector-icons';
// Haptics: use SafeHaptics from webSafe instead
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import Animated, { FadeInUp, FadeOutUp, FadeIn, FadeOut } from 'react-native-reanimated';
import { format } from 'date-fns';
import Constants from 'expo-constants';

import { Colors } from '../../src/constants/colors';
import { JournalEntry, EmotionData } from '../../src/types';
import { getEntryByDate, insertEntry, updateEntry } from '../../src/database/journalDB';
import { analyzeText, EmotionAnalysis } from '../../src/services/nlpService';
import { WordMirrorSheet } from '../../src/components/journal/WordMirrorSheet';

const AVAILABLE_TAGS = ['Morning', 'Evening', 'Work', 'Family', 'Dreams', 'Health'];

// A simple debounce hook
function useDebounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  const timeout = useRef<NodeJS.Timeout | undefined>();
  
  return useCallback((...args: Parameters<T>) => {
    const later = () => {
      clearTimeout(timeout.current);
      func(...args);
    };
    clearTimeout(timeout.current);
    timeout.current = setTimeout(later, wait);
  }, [func, wait]);
}

export default function JournalScreen() {
  const router = useRouter();
  const db = useDatabase();
  const hfApiKey = Constants.expoConfig?.extra?.hfApiKey;

  // State
  const [entryText, setEntryText] = useState('');
  const [detectedEmotions, setDetectedEmotions] = useState<EmotionData[]>([]);
  const [wordSuggestions, setWordSuggestions] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('What is occupying your mind the most right now?');
  const [showPrompt, setShowPrompt] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [existingEntryId, setExistingEntryId] = useState<number | null>(null);
  const [savedOverlayVisible, setSavedOverlayVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Word Mirror State
  const [mirrorVisible, setMirrorVisible] = useState(false);
  const [mirrorWord, setMirrorWord] = useState('');

  // Nudge State
  const [showAbsoluteNudge, setShowAbsoluteNudge] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // 1. Initial Load
  useEffect(() => {
    const loadTodayEntry = async () => {
      try {
        const entry = await getEntryByDate(db, todayStr);
        if (entry) {
          setExistingEntryId(Number(entry.id!));
          setEntryText(entry.content);
          setDetectedEmotions(entry.detectedEmotions || []);
          if (entry.promptUsed) setCurrentPrompt(entry.promptUsed);
          if (entry.tags) setSelectedTags(entry.tags);
        } else {
          // Focus input if brand new entry
          setTimeout(() => inputRef.current?.focus(), 500);
        }
      } catch (e) {
        console.error('Error loading entry:', e);
      }
    };
    loadTodayEntry();
  }, [db, todayStr]);

  // 2. Debounced Analysis
  const runNLP = async (text: string) => {
    if (text.trim().split(' ').length < 5) return; // Wait for a few words
    
    setIsAnalyzing(true);
    try {
      const analysis: EmotionAnalysis = await analyzeText(text, hfApiKey);
      setDetectedEmotions(analysis.emotions.slice(0, 3)); // Top 3
      setWordSuggestions(analysis.wordSuggestions);
      
      // Linguistic nudge
      if (analysis.linguisticMarkers?.absoluteLanguageScore && analysis.linguisticMarkers.absoluteLanguageScore > 0.12) {
        setShowAbsoluteNudge(true);
      } else {
        setShowAbsoluteNudge(false);
      }
      
      // Rotate prompt dynamically based on markers if active
      if (showPrompt && analysis.reflectionPrompt) {
        setCurrentPrompt(analysis.reflectionPrompt);
      }
    } catch (e) {
      console.warn('NLP Error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const debouncedRunNLP = useDebounce(runNLP, 800);

  const CRISIS_KEYWORDS = ['end my life', 'want to die', "can't go on", 'no point'];

  const handleTextChange = (text: string) => {
    setEntryText(text);
    setIsDirty(true);
    
    // Immediate Crisis Check
    const lower = text.toLowerCase();
    if (CRISIS_KEYWORDS.some(k => lower.includes(k))) {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
       router.push('/modals/safe-space');
       // In a full app, we would log this event to the DB silently here.
    }
    
    debouncedRunNLP(text);
  };

  const toggleTag = (tag: string) => {
    setIsDirty(true);
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 3. Save Logic
  const saveEntry = async (isAutoSave = false) => {
    if (!entryText.trim() && !existingEntryId) return; // Nothing to save
    if (!isAutoSave) setIsSaving(true);

    try {
      // One final analysis if saving manually
      let finalEmotions = detectedEmotions;
      let dominant = null;
      let linguistic = null;

      if (!isAutoSave && entryText.trim().split(' ').length > 5) {
        try {
           const analysis = await analyzeText(entryText, hfApiKey);
           finalEmotions = analysis.emotions;
           dominant = { emotion: analysis.dominantEmotion, color: analysis.dominantColor, score: 1 };
           linguistic = analysis.linguisticMarkers;
        } catch(e) {}
      } else if (finalEmotions.length > 0) {
         dominant = finalEmotions[0];
      }

      const entryData: Partial<JournalEntry> = {
        date: todayStr,
        content: entryText,
        wordCount: entryText.trim().split(/\s+/).filter(w => w.length > 0).length,
        detectedEmotions: finalEmotions,
        dominantEmotion: dominant || undefined,
        tags: selectedTags,
        promptUsed: currentPrompt,
        linguisticScore: linguistic as any || undefined
      };

      if (existingEntryId) {
        await updateEntry(db, existingEntryId, entryData);
      } else {
        const newId = await insertEntry(db, entryData);
        setExistingEntryId(newId);
      }

      setIsDirty(false);

      if (!isAutoSave) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSavedOverlayVisible(true);
        setTimeout(() => setSavedOverlayVisible(false), 2000);
      }

    } catch (e) {
      console.error('Save failed', e);
      if (!isAutoSave) Alert.alert('Error', 'Failed to save entry');
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  // 4. Auto-save Interval (Every 30s if dirty)
  const handleMirrorApply = (newWord: string) => {
    // Basic substitution: replace last instance of the base word, or just append it if not found easily
    // This is simple replacement logic for the MVP
    let newText = entryText.replace(new RegExp(`${mirrorWord}\\b`, 'gi'), newWord);
    if (newText === entryText) { // Fallback if word was derived or not exactly typed
      newText = entryText + ' ' + newWord;
    }
    setEntryText(newText);
    setIsDirty(true);
    setWordSuggestions(prev => prev.filter(w => w !== mirrorWord));
  };

  const wordCount = entryText.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <Text style={styles.headerDate}>{format(new Date(), 'EEEE, MMM d')}</Text>
        
        <TouchableOpacity 
          style={[styles.saveBtn, isDirty ? styles.saveBtnActive : styles.saveBtnInactive]}
          onPress={() => saveEntry(false)}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
             <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
             <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
      >
        {/* Dismissable Prompt */}
        {showPrompt && (
          <Animated.View 
            entering={FadeInUp} 
            exiting={FadeOutUp} 
            style={styles.promptCard}
          >
            <View style={styles.promptIconRow}>
               <Feather name="star" size={16} color={Colors.primary} />
               <Text style={styles.promptText}>{currentPrompt}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPrompt(false)}>
              <Feather name="x" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Paper Writing Area */}
        <View style={styles.writingCard}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            multiline
            placeholder="Begin writing freely. This space belongs only to you..."
            placeholderTextColor="#C0B8B0"
            value={entryText}
            onChangeText={handleTextChange}
            textAlignVertical="top"
          />
          <Text style={[styles.wordCount, wordCount >= 50 && styles.wordCountHigh]}>
            {wordCount} words
          </Text>
        </View>

        {/* Absolute Language Nudge */}
        {showAbsoluteNudge && (
          <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.nudgeCard}>
             <Text style={styles.nudgeText}>You're using some strong, absolute words — want to explore that gently?</Text>
             <TouchableOpacity onPress={() => setShowAbsoluteNudge(false)}>
               <Feather name="x" size={16} color="#A0ADB8" />
             </TouchableOpacity>
          </Animated.View>
        )}

        {/* Context Tags */}
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>Add context:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {AVAILABLE_TAGS.map(tag => {
              const selected = selectedTags.includes(tag);
              return (
                <TouchableOpacity 
                  key={tag} 
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagBtn, selected && styles.tagBtnSelected]}
                >
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Word Suggestions Strip */}
        {wordSuggestions.length > 0 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.suggestionsContainer}>
            <Text style={styles.tagsLabel}>✨ Richer words</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {wordSuggestions.map((word, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.suggestionPill}
                  onPress={() => {
                     Haptics.selectionAsync();
                     setMirrorWord(word);
                     setMirrorVisible(true);
                  }}
                >
                  <Text style={styles.suggestionText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

      </ScrollView>

      {/* Sticky Emotion Detection Bar */}
      <View style={styles.emotionBar}>
        <View style={styles.emotionBarLeft}>
          <Text style={styles.sensingText}>Sensing:</Text>
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 10 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emotionScroll}>
               {detectedEmotions.length > 0 ? (
                 detectedEmotions.map((em, idx) => (
                   <View key={idx} style={[styles.emotionBadge, { backgroundColor: `${em.color}20` }]}>
                      <Text style={[styles.emotionBadgeText, { color: em.color }]}>
                        {em.emotion} {Math.round(em.score * 100)}%
                      </Text>
                   </View>
                 ))
               ) : (
                 <Text style={styles.neutralSenseText}>Writing...</Text>
               )}
            </ScrollView>
          )}
        </View>
        <TouchableOpacity>
           <Feather name="info" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Brief Overlays */}
      {savedOverlayVisible && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.savedOverlay}>
           <Feather name="check" size={16} color="#FFFFFF" />
           <Text style={styles.savedOverlayText}>Saved</Text>
        </Animated.View>
      )}

      </KeyboardAvoidingView>

      {/* WORD MIRROR MODAL OVERLAY */}
      <WordMirrorSheet 
        isVisible={mirrorVisible}
        detectedWord={mirrorWord}
        onClose={() => setMirrorVisible(false)}
        onWordSelected={handleMirrorApply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerDate: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnActive: {
    backgroundColor: Colors.primary,
  },
  saveBtnInactive: {
    backgroundColor: '#D4DEE8',
  },
  saveBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  promptCard: {
    backgroundColor: Colors.softBlue,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 141, 184, 0.1)',
  },
  promptIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 15,
  },
  promptText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: Colors.primary,
    marginLeft: 12,
  },
  writingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    minHeight: 350,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  wordCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#A0ADB8',
    textAlign: 'right',
    marginTop: 10,
  },
  wordCountHigh: {
    color: Colors.secondary, // Green
  },
  nudgeCard: {
    backgroundColor: '#FFF0E6',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#E8A87C',
  },
  nudgeText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  tagBtn: {
    backgroundColor: '#F0EDE8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tagBtnSelected: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionPill: {
    backgroundColor: '#F0EDE8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: '#5B6B78',
  },
  emotionBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emotionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 15,
  },
  sensingText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  neutralSenseText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#C0B8B0',
    fontStyle: 'italic',
  },
  emotionScroll: {
    flex: 1,
  },
  emotionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  emotionBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  savedOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(44, 62, 80, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedOverlayText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
