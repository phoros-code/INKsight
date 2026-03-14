import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';
import * as journalDB from '../../src/database/journalDB';

const WORD_SUGGESTIONS = ['melancholic', 'at peace', 'restless'];
const CONTEXT_TAGS = [
  { icon: 'wb-sunny' as const, label: 'Morning' },
  { icon: 'work-outline' as const, label: 'Work' },
  { icon: 'home' as const, label: 'Home' },
];

const PROMPTS = [
  "What's been occupying your mind today?",
  "Describe a moment that made you pause.",
  "If your mood were a weather pattern, what would it be?",
  "What would you tell your yesterday self?",
  "What small thing brought you comfort today?",
];

export default function JournalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [detectedEmotions, setDetectedEmotions] = useState([
    { emotion: 'calm', color: Colors.sage },
    { emotion: 'pensive', color: '#89ABD4' },
  ]);
  const [prompt, setPrompt] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  // Simple emotion detection based on keywords
  useEffect(() => {
    if (!content) return;
    const lower = content.toLowerCase();
    const found: { emotion: string; color: string }[] = [];
    if (lower.includes('peace') || lower.includes('calm') || lower.includes('quiet')) found.push({ emotion: 'calm', color: Colors.sage });
    if (lower.includes('anxious') || lower.includes('worry') || lower.includes('stress')) found.push({ emotion: 'anxious', color: '#89B4D4' });
    if (lower.includes('happy') || lower.includes('joy') || lower.includes('grateful')) found.push({ emotion: 'joyful', color: '#F5D769' });
    if (lower.includes('sad') || lower.includes('cry') || lower.includes('miss')) found.push({ emotion: 'melancholy', color: '#8899C4' });
    if (lower.includes('hope') || lower.includes('better') || lower.includes('looking forward')) found.push({ emotion: 'hopeful', color: '#90C49A' });
    if (lower.includes('think') || lower.includes('wonder') || lower.includes('reflect')) found.push({ emotion: 'pensive', color: '#89ABD4' });
    if (found.length > 0) setDetectedEmotions(found.slice(0, 3));
  }, [content]);

  const toggleTag = (label: string) => {
    setSelectedTags(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

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
        tags: selectedTags,
        moodScore: 6,
        promptUsed: prompt,
      };
      await journalDB.insertEntry(null, entry);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.warn('Save error:', e); }
  };

  const today = new Date();
  const dateLabel = `${['January','February','March','April','May','June','July','August','September','October','November','December'][today.getMonth()]} ${today.getDate()}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Nav */}
      <View style={[styles.topNav, { backgroundColor: theme.background + 'CC' }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={20} color={theme.textMuted} />
          <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>Close</Text>
        </TouchableOpacity>
        <Text style={[styles.dateTitle, { color: theme.textMain }]}>{dateLabel}</Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
          <Text style={[styles.saveBtnText, { color: theme.primaryButtonText }]}>{saved ? '✓ Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
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
              <MaterialIcons name="auto-fix-high" size={14} color={Colors.primary} />
              <Text style={styles.wordMirrorLabelText}>WORD SUGGESTIONS</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {WORD_SUGGESTIONS.map((w, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => setContent(prev => prev + ' ' + w)}>
                  <Text style={styles.suggestionText}>{w}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.wordMirrorBtn}
              onPress={() => router.push('/modals/word-mirror' as any)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="psychology" size={16} color={theme.primary} />
              <Text style={[styles.wordMirrorBtnText, { color: theme.primary }]}>Word Mirror</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Context Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>ADD CONTEXT:</Text>
          <View style={styles.tagsRow}>
            {CONTEXT_TAGS.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.contextTag, selectedTags.includes(t.label) && styles.contextTagActive]}
                onPress={() => toggleTag(t.label)}
              >
                <MaterialIcons name={t.icon} size={16} color={selectedTags.includes(t.label) ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.contextTagText, selectedTags.includes(t.label) && { color: Colors.primary }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.addTagBtn}>
              <MaterialIcons name="add" size={18} color={Colors.textMuted + '80'} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Emotion Detection Bar */}
      <TouchableOpacity
        style={styles.emotionBar}
        onPress={() => router.push('/modals/emotion-wheel' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.emotionBarLeft}>
          <Text style={styles.sensingLabel}>SENSING:</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: Colors.background + 'CC',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
  },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  closeBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textMuted },
  dateTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: Colors.textDark, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 6,
    borderRadius: 20,
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFF', fontWeight: '600' },

  mainScroll: { flex: 1 },
  mainContent: { paddingHorizontal: 16, gap: 16, paddingBottom: 100 },

  promptCard: {
    backgroundColor: Colors.accentBlue, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.primary + '15', gap: 12,
  },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promptLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  promptText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 20, color: Colors.textDark, lineHeight: 28 },

  writingCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5E7EB',
    minHeight: 300,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  textarea: {
    flex: 1, padding: 24, minHeight: 250,
    fontFamily: 'Lora_400Regular_Italic', fontSize: 18, color: '#374151',
    lineHeight: 32,
  },
  wordMirrorStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  wordMirrorLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wordMirrorLabelText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: Colors.primary, letterSpacing: -0.3 },
  suggestionsScroll: { flexDirection: 'row' },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: Colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8,
  },
  suggestionText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#6B7280' },

  tagsSection: { paddingHorizontal: 8, gap: 8 },
  tagsLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contextTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  contextTagActive: { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '08' },
  contextTagText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#6B7280' },
  addTagBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },

  emotionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  emotionBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sensingLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, color: Colors.textMuted, letterSpacing: 2 },
  sensedEmotions: { flexDirection: 'row', gap: 8 },
  sensedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  sensedDot: { width: 6, height: 6, borderRadius: 3 },
  sensedText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, fontWeight: '600' },

  wordMirrorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, backgroundColor: Colors.primary + '10',
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  wordMirrorBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, fontWeight: '600' },
});
