import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';
import * as journalDB from '../../src/database/journalDB';

const WORD_SUGGESTIONS = [
  'melancholic', 'at peace', 'restless', 'grateful', 'curious',
  'hopeful', 'overwhelmed', 'serene', 'anxious', 'joyful',
  'reflective', 'content', 'uncertain', 'inspired', 'nostalgic',
];

const CONTEXT_TAGS: { icon: string; label: string }[] = [
  { icon: 'wb-sunny', label: 'Morning' },
  { icon: 'work-outline', label: 'Work' },
  { icon: 'home', label: 'Home' },
  { icon: 'nightlight-round', label: 'Evening' },
  { icon: 'directions-walk', label: 'Walk' },
  { icon: 'restaurant', label: 'Meal' },
];

const PROMPTS = [
  "What's been occupying your mind today?",
  "Describe a moment that made you pause.",
  "If your mood were a weather pattern, what would it be?",
  "What would you tell your yesterday self?",
  "What small thing brought you comfort today?",
];

// Generate date range for calendar strip
function generateDateRange(days: number): { date: Date; dateStr: string }[] {
  const result: { date: Date; dateStr: string }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push({ date: d, dateStr: d.toISOString().split('T')[0] });
  }
  return result;
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function JournalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // single-select
  const [detectedEmotions, setDetectedEmotions] = useState([
    { emotion: 'calm', color: Colors.sage },
    { emotion: 'pensive', color: '#89ABD4' },
  ]);
  const [prompt, setPrompt] = useState('');
  const [saved, setSaved] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [allTags, setAllTags] = useState(CONTEXT_TAGS);
  const [manualEmotion, setManualEmotion] = useState(false);

  // Calendar mode
  const [calendarDates] = useState(() => generateDateRange(90));
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const displayedDates = calendarExpanded ? calendarDates : calendarDates.slice(-7);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isViewingPast, setIsViewingPast] = useState(false);
  const [viewedEntry, setViewedEntry] = useState<any>(null);
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());

  // Load entry dates for calendar dots
  useEffect(() => {
    if (Platform.OS === 'web') {
      const all = webStore.getAllEntries();
      setEntryDates(new Set(all.map(e => e.date)));
    }
  }, [saved]);

  useEffect(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  // When a date is selected, load the entry for that date
  useEffect(() => {
    if (selectedDate === todayStr) {
      setIsViewingPast(false);
      setViewedEntry(null);
      return;
    }
    if (Platform.OS === 'web') {
      const entry = webStore.getEntryByDate(selectedDate);
      if (entry) {
        setIsViewingPast(true);
        setViewedEntry(entry);
      } else {
        setIsViewingPast(true);
        setViewedEntry(null);
      }
    }
  }, [selectedDate]);

  // Fetch temporary emotions on focus
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        try {
          const temp = localStorage.getItem('inksight_temp_emotions');
          if (temp) {
            setDetectedEmotions(JSON.parse(temp));
            setManualEmotion(true);
            localStorage.removeItem('inksight_temp_emotions');
          }
        } catch {}
      }
    }, [])
  );

  // Emotion detection
  useEffect(() => {
    if (!content || isViewingPast || manualEmotion) return;
    const lower = content.toLowerCase();
    const found: { emotion: string; color: string }[] = [];
    if (lower.includes('peace') || lower.includes('calm') || lower.includes('quiet')) found.push({ emotion: 'calm', color: Colors.sage });
    if (lower.includes('anxious') || lower.includes('worry') || lower.includes('stress')) found.push({ emotion: 'anxious', color: '#89B4D4' });
    if (lower.includes('happy') || lower.includes('joy') || lower.includes('grateful')) found.push({ emotion: 'joyful', color: '#F5D769' });
    if (lower.includes('sad') || lower.includes('cry') || lower.includes('miss')) found.push({ emotion: 'melancholy', color: '#8899C4' });
    if (lower.includes('hope') || lower.includes('better') || lower.includes('looking forward')) found.push({ emotion: 'hopeful', color: '#90C49A' });
    if (lower.includes('think') || lower.includes('wonder') || lower.includes('reflect')) found.push({ emotion: 'pensive', color: '#89ABD4' });
    if (found.length > 0) setDetectedEmotions(found.slice(0, 3));
  }, [content, isViewingPast, manualEmotion]);

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      const emotions = detectedEmotions.map(e => ({ ...e, score: 0.7 + Math.random() * 0.3 }));
      const entry = {
        date: new Date().toISOString().split('T')[0],
        content: content.trim(),
        wordCount: content.trim().split(/\s+/).length,
        detectedEmotions: emotions,
        dominantEmotion: emotions[0] || null,
        tags: selectedTag ? [selectedTag] : [],
        moodScore: 6,
        promptUsed: prompt,
      };
      await journalDB.insertEntry(null, entry);
      setSaved(true);
      setContent('');
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.warn('Save error:', e); }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      const newTag = { icon: 'label' as const, label: customTag.trim() };
      setAllTags(prev => [...prev, newTag]);
      setSelectedTag(customTag.trim());
      setCustomTag('');
      setShowCustomInput(false);
    }
  };

  const today = new Date();
  const dateLabel = `${MONTHS_SHORT[today.getMonth()]} ${today.getDate()}`;

  // Parse viewed entry emotions
  const viewedEmotions = viewedEntry ? (() => {
    try {
      return typeof viewedEntry.detected_emotions === 'string'
        ? JSON.parse(viewedEntry.detected_emotions)
        : viewedEntry.detected_emotions || [];
    } catch { return []; }
  })() : [];

  const viewedMoodScore = viewedEntry?.mood_score || 0;
  const moodEmoji = viewedMoodScore >= 8 ? '😊' : viewedMoodScore >= 6 ? '🙂' : viewedMoodScore >= 4 ? '😐' : '😔';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Nav */}
      <View style={[styles.topNav, { backgroundColor: theme.background + 'CC' }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={20} color={theme.textMuted} />
          <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>Close</Text>
        </TouchableOpacity>
        <Text style={[styles.dateTitle, { color: theme.textMain }]}>
          {isViewingPast ? selectedDate : dateLabel}
        </Text>
        {!isViewingPast ? (
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
            <Text style={[styles.saveBtnText, { color: theme.primaryButtonText }]}>{saved ? '✓ Saved' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Calendar Date Strip */}
      <View style={styles.calendarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarStrip}
          style={styles.calendarContainer}
        >
          {displayedDates.map(({ date, dateStr }) => {
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasEntry = entryDates.has(dateStr);
            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calendarDay,
                  { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF0D' : '#0000000A' },
                  isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setSelectedDate(dateStr)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.calendarDayName,
                  { color: theme.textMuted },
                  isSelected && { color: theme.primaryButtonText },
                ]}>
                  {DAYS_SHORT[date.getDay()]}
                </Text>
                <Text style={[
                  styles.calendarDayNum,
                  { color: theme.textMain },
                  isSelected && { color: theme.primaryButtonText },
                ]}>
                  {date.getDate()}
                </Text>
                {hasEntry && !isSelected && (
                  <View style={[styles.calendarDot, { backgroundColor: theme.primary }]} />
                )}
                {isToday && !isSelected && (
                  <View style={[styles.calendarDot, { backgroundColor: '#F59E0B' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={[styles.expandCalendarBtn, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF0D' : '#0000000A' }]} onPress={() => setCalendarExpanded(!calendarExpanded)}>
          <MaterialIcons name={calendarExpanded ? "chevron-right" : "chevron-left"} size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {isViewingPast ? (
        /* Past Entry View */
        <ScrollView style={styles.mainScroll} contentContainerStyle={[styles.mainContent, { paddingBottom: 140 }]} showsVerticalScrollIndicator={false}>
          {viewedEntry ? (
            <>
              {/* Mood Badge */}
              <View style={[styles.moodBadge, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF10' : '#0000000A' }]}>
                <Text style={styles.moodEmoji}>{moodEmoji}</Text>
                <View>
                  <Text style={[styles.moodLabel, { color: theme.textMuted }]}>MOOD SCORE</Text>
                  <Text style={[styles.moodValue, { color: theme.textMain }]}>{viewedMoodScore}/10</Text>
                </View>
                <View style={styles.moodEmotions}>
                  {viewedEmotions.slice(0, 3).map((em: any, i: number) => (
                    <View key={i} style={[styles.moodPill, { backgroundColor: (em.color || theme.primary) + '20' }]}>
                      <Text style={[styles.moodPillText, { color: em.color || theme.primary }]}>{em.emotion}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Entry Content */}
              <View style={[styles.pastEntryCard, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF15' : '#E5E7EB' }]}>
                <Text style={[styles.pastEntryTime, { color: theme.textMuted }]}>
                  {new Date(viewedEntry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={[styles.pastEntryText, { color: theme.textMain }]}>
                  {viewedEntry.content}
                </Text>
                {viewedEntry.tags && (
                  <View style={styles.pastEntryTags}>
                    {(typeof viewedEntry.tags === 'string' ? JSON.parse(viewedEntry.tags) : viewedEntry.tags).map((t: string, i: number) => (
                      <View key={i} style={[styles.pastTag, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.pastTagText, { color: theme.primary }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Back to today */}
              <TouchableOpacity
                style={[styles.backToTodayBtn, { backgroundColor: theme.primary }]}
                onPress={() => setSelectedDate(todayStr)}
              >
                <MaterialIcons name="edit" size={18} color={theme.primaryButtonText} />
                <Text style={[styles.backToTodayText, { color: theme.primaryButtonText }]}>Write Today's Entry</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyPast}>
              <Text style={{ fontSize: 48 }}>📝</Text>
              <Text style={[styles.emptyPastTitle, { color: theme.textMain }]}>No entry for this day</Text>
              <Text style={[styles.emptyPastSub, { color: theme.textMuted }]}>You didn't journal on this date.</Text>
              <TouchableOpacity
                style={[styles.backToTodayBtn, { backgroundColor: theme.primary }]}
                onPress={() => setSelectedDate(todayStr)}
              >
                <Text style={[styles.backToTodayText, { color: theme.primaryButtonText }]}>Write Today's Entry</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Today: Writing Mode */
        <ScrollView style={styles.mainScroll} contentContainerStyle={[styles.mainContent, { paddingBottom: 140 }]} showsVerticalScrollIndicator={false}>
          {/* Prompt Card */}
          <View style={[styles.promptCard, { backgroundColor: theme.isDark ? theme.card : Colors.accentBlue, borderColor: theme.primary + '15' }]}>
            <View style={styles.promptHeader}>
              <MaterialIcons name="auto-awesome" size={20} color={theme.primary} />
              <Text style={[styles.promptLabel, { color: theme.primary }]}>DAILY SPARK</Text>
            </View>
            <Text style={[styles.promptText, { color: theme.textMain }]}>{prompt}</Text>
          </View>

          {/* Writing Area */}
          <View style={[styles.writingCard, { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF15' : '#E5E7EB' }]}>
            <TextInput
              style={[styles.textarea, { color: theme.textMain }]}
              placeholder="Begin writing freely..."
              placeholderTextColor={theme.textMuted + '80'}
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
            {/* Word Mirror Strip */}
            <View style={styles.wordMirrorStrip}>
              <View style={styles.wordMirrorLabel}>
                <MaterialIcons name="auto-fix-high" size={14} color={theme.primary} />
                <Text style={[styles.wordMirrorLabelText, { color: theme.primary }]}>WORD SUGGESTIONS</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                {WORD_SUGGESTIONS.map((w, i) => (
                  <TouchableOpacity key={i} style={[styles.suggestionChip, { backgroundColor: theme.background, borderColor: theme.isDark ? '#FFFFFF15' : '#E5E7EB' }]} onPress={() => setContent(prev => prev + ' ' + w)}>
                    <Text style={[styles.suggestionText, { color: theme.textMuted }]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.wordMirrorBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}
                onPress={() => router.push('/modals/word-mirror' as any)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="psychology" size={16} color={theme.primary} />
                <Text style={[styles.wordMirrorBtnText, { color: theme.primary }]}>Word Mirror</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Context Tags — Single Select */}
          <View style={styles.tagsSection}>
            <Text style={[styles.tagsLabel, { color: theme.textMuted }]}>ADD CONTEXT:</Text>
            <View style={styles.tagsRow}>
              {allTags.map((t, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.contextTag,
                    { backgroundColor: theme.card, borderColor: theme.isDark ? '#FFFFFF15' : '#E5E7EB' },
                    selectedTag === t.label && { borderColor: theme.primary + '40', backgroundColor: theme.primary + '08' },
                  ]}
                  onPress={() => setSelectedTag(selectedTag === t.label ? null : t.label)}
                >
                  <MaterialIcons name={t.icon as any} size={16} color={selectedTag === t.label ? theme.primary : theme.textMuted} />
                  <Text style={[styles.contextTagText, { color: theme.textMuted }, selectedTag === t.label && { color: theme.primary }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
              {showCustomInput ? (
                <View style={[styles.customTagInput, { borderColor: theme.primary }]}>
                  <TextInput
                    style={[styles.customTagField, { color: theme.textMain }]}
                    placeholder="Tag name..."
                    placeholderTextColor={theme.textMuted + '80'}
                    value={customTag}
                    onChangeText={setCustomTag}
                    onSubmitEditing={handleAddCustomTag}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleAddCustomTag}>
                    <MaterialIcons name="check" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.addTagBtn, { borderColor: theme.textMuted + '40' }]} onPress={() => setShowCustomInput(true)}>
                  <MaterialIcons name="add" size={18} color={theme.textMuted + '80'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Emotion Detection Bar — only in write mode */}
      {!isViewingPast && (
        <TouchableOpacity
          style={[styles.emotionBar, { backgroundColor: theme.card, borderTopColor: theme.isDark ? '#FFFFFF10' : '#E5E7EB' }]}
          onPress={() => router.push('/modals/emotion-wheel' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.emotionBarLeft}>
            <Text style={[styles.sensingLabel, { color: theme.textMuted }]}>SENSING:</Text>
            <View style={styles.sensedEmotions}>
              {detectedEmotions.slice(0, 2).map((em, i) => (
                <View key={i} style={[styles.sensedPill, { backgroundColor: em.color + '20' }]}>
                  <View style={[styles.sensedDot, { backgroundColor: em.color }]} />
                  <Text style={[styles.sensedText, { color: em.color }]}>{em.emotion}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: theme.primary }}>Explore</Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
  },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  closeBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  dateTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, fontWeight: '600' },
  saveBtn: {
    paddingHorizontal: 24, paddingVertical: 6,
    borderRadius: 20,
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, fontWeight: '600' },

  // Calendar Strip
  calendarWrapper: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, width: '100%' },
  calendarContainer: { maxHeight: 80, flex: 1 },
  calendarStrip: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  calendarDay: {
    width: 52, height: 66, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    borderWidth: 1,
  },
  calendarDayName: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  calendarDayNum: { fontFamily: 'Inter_700Bold', fontSize: 18, fontWeight: '700' },
  calendarDot: { width: 5, height: 5, borderRadius: 3 },
  expandCalendarBtn: { width: 40, height: 66, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },

  mainScroll: { flex: 1 },
  mainContent: { paddingHorizontal: 16, gap: 16 },

  // Past entry view
  moodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  moodEmoji: { fontSize: 36 },
  moodLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, textTransform: 'uppercase' as any, letterSpacing: 1 },
  moodValue: { fontFamily: 'Inter_700Bold', fontSize: 20, fontWeight: '700' },
  moodEmotions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  moodPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  moodPillText: { fontFamily: 'Inter_500Medium', fontSize: 11, fontWeight: '500' },

  pastEntryCard: {
    borderRadius: 16, padding: 24, borderWidth: 1, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  pastEntryTime: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  pastEntryText: { fontFamily: 'Lora_400Regular', fontSize: 16, lineHeight: 28 },
  pastEntryTags: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pastTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pastTagText: { fontFamily: 'Inter_500Medium', fontSize: 11, fontWeight: '500' },

  emptyPast: { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyPastTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, fontWeight: '700' },
  emptyPastSub: { fontFamily: 'Inter_400Regular', fontSize: 14 },

  backToTodayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 16,
  },
  backToTodayText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, fontWeight: '600' },

  // Write mode
  promptCard: {
    borderRadius: 16, padding: 20,
    borderWidth: 1, gap: 12,
  },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promptLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' as any },
  promptText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 20, lineHeight: 28 },

  writingCard: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1,
    minHeight: 300,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  textarea: {
    flex: 1, padding: 24, minHeight: 250,
    fontFamily: 'Lora_400Regular_Italic', fontSize: 18,
    lineHeight: 32,
  },
  wordMirrorStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  wordMirrorLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wordMirrorLabelText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: -0.3 },
  suggestionsScroll: { flexDirection: 'row' },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1, marginRight: 8,
  },
  suggestionText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  wordMirrorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  wordMirrorBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, fontWeight: '600' },

  tagsSection: { paddingHorizontal: 8, gap: 8 },
  tagsLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contextTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  contextTagText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  addTagBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },

  customTagInput: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  customTagField: {
    fontFamily: 'Inter_500Medium', fontSize: 14,
    width: 80, paddingVertical: 4,
  },

  emotionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1,
    marginBottom: 100, // Account for floating tab bar
  },
  emotionBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sensingLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 2 },
  sensedEmotions: { flexDirection: 'row', gap: 8 },
  sensedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  sensedDot: { width: 6, height: 6, borderRadius: 3 },
  sensedText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, fontWeight: '600' },
});
