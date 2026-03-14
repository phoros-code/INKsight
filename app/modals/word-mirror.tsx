import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';

// Extract meaningful words from journal entries
function extractWords(entries: any[]): { word: string; definition: string; trend: string | null; intensity: number; organic: boolean }[] {
  const wordCounts: Record<string, number> = {};
  const stopWords = new Set(['the','a','an','is','was','were','are','am','be','been','being','have','has','had','do','does','did','will','would','should','could','can','may','might','must','shall','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their','this','that','these','those','and','or','but','if','because','as','while','of','in','to','for','with','on','at','from','by','about','into','through','during','before','after','above','below','between','not','no','just','so','than','too','very','also','only','like','even','then','such','both','each','all','any','few','more','most','other','some','which','what','when','where','who','how','up','out','down','over','back','still','here','there','now','well','many','much','something','nothing','everything','today','time','day','week','feel','felt','know','think','see','want','make','get','go','come','take','find','way','things','made','really','always','never','every','been','going','got','don\u0027t','didn\u0027t','doesn\u0027t','can\u0027t','won\u0027t','it\u0027s','i\u0027m','i\u0027ve','let','put','old','new','long','little','big','own','went','said','need','work']);
  
  entries.forEach(e => {
    const words = (e.content || '').toLowerCase().replace(/[^a-z\s'-]/g, '').split(/\s+/);
    words.forEach((w: string) => {
      if (w.length > 4 && !stopWords.has(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const definitions: Record<string, string> = {
    'silence': '"The complete absence of sound, or a state of peace."',
    'feeling': '"An emotional state or reaction."',
    'morning': '"The period from sunrise to noon."',
    'evening': '"The period approaching night."',
    'thoughts': '"Ideas or opinions produced by thinking."',
    'walking': '"Moving at a regular pace on foot."',
    'anxiety': '"A feeling of worry or unease."',
    'writing': '"The activity of composing text."',
    'myself': '"Used to reflect back on the speaker."',
    'peace': '"Freedom from disturbance; tranquility."',
    'quiet': '"Making little or no noise."',
    'first': '"Coming before all others in time."',
    'small': '"Of a size that is less than normal."',
    'light': '"The natural agent that makes things visible."',
    'world': '"The earth, together with all of its countries."',
    'resilience': '"The capacity to recover quickly from difficulties."',
    'ambivalence': '"Coexisting contradictory feelings toward an object."',
    'wonder': '"A feeling of surprise mingled with admiration."',
    'growth': '"The process of developing or maturing."',
    'curiosity': '"A strong desire to know or learn something."',
    'reflection': '"Serious thought or consideration."',
    'comfort': '"A state of physical ease and well-being."',
    'healing': '"The process of making or becoming sound."',
    'strength': '"The quality of being strong."',
    'clarity': '"The quality of being clear and easy to understand."',
    'gratitude': '"The quality of being thankful."',
    'courage': '"The ability to do something that frightens one."',
    'vulnerability': '"The quality of being open to emotional risk."',
    'presence': '"The state of being present in the current moment."',
    'softness': '"The quality of being gentle and tender."',
  };

  return sorted.map(([word, count], i) => ({
    word: word.charAt(0).toUpperCase() + word.slice(1),
    definition: definitions[word] || `"A word you've used ${count} time${count !== 1 ? 's' : ''} in your reflections."`,
    trend: count > 3 ? 'up' : null,
    intensity: Math.min(4, Math.floor(count / 2)),
    organic: i % 2 === 0,
  }));
}

export default function WordMirrorModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const [wordCards, setWordCards] = useState<any[]>([]);
  const [coreTheme, setCoreTheme] = useState('Your recent entries suggest a strengthening pattern of emotional regulation.');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const entries = webStore.getAllEntries();
      if (entries.length > 0) {
        const extracted = extractWords(entries);
        if (extracted.length > 0) setWordCards(extracted);
        
        // Generate core theme from emotions
        const emotionCounts: Record<string, number> = {};
        entries.forEach(e => {
          try {
            const ems = typeof e.detected_emotions === 'string' ? JSON.parse(e.detected_emotions) : [];
            ems.forEach((em: any) => {
              emotionCounts[em.emotion] = (emotionCounts[em.emotion] || 0) + 1;
            });
          } catch {}
        });
        const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
        if (topEmotion) {
          setCoreTheme(`Your journal entries reveal a strong pattern of "${topEmotion[0]}" appearing across ${topEmotion[1]} entries. This reflects your inner landscape and emotional growth.`);
        }
      } else {
        // Default static words if no entries
        setWordCards([
          { word: 'Resilience', definition: '"The capacity to recover quickly from difficulties."', trend: 'up', intensity: 3, organic: true },
          { word: 'Ambivalence', definition: '"Coexisting contradictory feelings toward an object."', trend: null, intensity: 1, organic: false },
        ]);
      }
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background content (dimmed) */}
      <View style={styles.bgContent}>
        <View style={styles.bgHeader}>
          <MaterialIcons name="menu" size={24} color="#94A3B8" />
          <View style={styles.bgAvatar}>
            <MaterialIcons name="person" size={20} color={Colors.accent} />
          </View>
        </View>
        <Text style={[styles.bgTitle, { color: theme.textMain }]}>Today's Reflection</Text>
        <Text style={styles.bgDate}>June 12, 2024</Text>
        <View style={[styles.bgCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.bgText, { color: theme.textMain }]}>I woke up feeling a strange mix of anticipation and calm. The morning light was soft against the walls...</Text>
        </View>
      </View>

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: theme.isDark ? '#FFFFFF20' : '#E2E8F0' }]} />
        </View>

        {/* Header */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: theme.textMain }]}>Word Mirror ✨</Text>
          <TouchableOpacity>
            <MaterialIcons name="auto-fix-high" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>EXPLORE DEEPER</Text>

          {/* Word Cards */}
          {wordCards.map((card, i) => (
            <View key={i} style={[
              styles.wordCard,
              card.organic
                ? [styles.wordCardOrganic, { backgroundColor: theme.isDark ? theme.background : '#FDEEE740', borderColor: theme.primary + '1A' }]
                : [styles.wordCardAlt, { backgroundColor: theme.isDark ? theme.background : '#F8FAFC', borderColor: theme.isDark ? '#FFFFFF10' : '#F1F5F9' }],
            ]}>
              <View style={styles.wordCardHeader}>
                <View>
                  <Text style={[styles.wordTitle, { color: theme.textMain }]}>{card.word}</Text>
                  <Text style={[styles.wordDef, { color: theme.textMuted }]}>{card.definition}</Text>
                </View>
                {card.trend && (
                  <MaterialIcons name="trending-up" size={16} color={theme.primary} />
                )}
              </View>
              {/* Intensity Scale */}
              <View style={styles.intensityScale}>
                <View style={[styles.intensityLine, { backgroundColor: theme.textMain, opacity: 0.1 }]} />
                <View style={styles.intensityDots}>
                  {[0,1,2,3,4].map(d => (
                    <View key={d} style={[
                      styles.intensityDot,
                      d === card.intensity && [styles.intensityDotActive, { backgroundColor: theme.primary, shadowColor: theme.primary }],
                      d < card.intensity && { backgroundColor: theme.primary + '66' },
                    ]} />
                  ))}
                </View>
                <View style={styles.intensityLabels}>
                  <Text style={[styles.intensityLabelText, { color: theme.textMuted }]}>Subtle</Text>
                  <Text style={[styles.intensityLabelText, { color: theme.primary, fontWeight: '700' }]}>Intense</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Core Theme */}
          <View style={[styles.coreTheme, { backgroundColor: theme.isDark ? theme.background : '#F8FAFC', borderColor: theme.isDark ? '#FFFFFF15' : '#E2E8F0' }]}>
            <View style={[styles.coreThemeIcon, { backgroundColor: theme.primary + '15' }]}>
              <MaterialIcons name="psychology" size={28} color={theme.primary} />
            </View>
            <View style={styles.coreThemeContent}>
              <Text style={[styles.coreThemeLabel, { color: theme.textMuted }]}>CORE THEME</Text>
              <Text style={[styles.coreThemeText, { color: theme.textMain + 'CC' }]}>{coreTheme}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={[styles.sheetFooter, { backgroundColor: theme.card + 'CC' }]}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={() => router.back()} activeOpacity={0.9}>
            <MaterialIcons name="draw" size={20} color={theme.primaryButtonText} />
            <Text style={[styles.addBtnText, { color: theme.primaryButtonText }]}>Add to Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, maxWidth: 448, alignSelf: 'center', width: '100%' },

  bgContent: { flex: 1, padding: 24, gap: 8, opacity: 0.4 },
  bgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bgAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent + '33', alignItems: 'center', justifyContent: 'center' },
  bgTitle: { fontFamily: 'Nunito_700Bold', fontSize: 28, fontWeight: '700', marginTop: 16 },
  bgDate: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#94A3B8' },
  bgCard: { padding: 24, borderRadius: 16, marginTop: 16 },
  bgText: { fontFamily: 'Lora_400Regular', fontSize: 15, lineHeight: 24 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A33',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(2px)' } as any : {}),
  },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
    borderTopLeftRadius: 40, borderTopRightRadius: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20,
  },
  handleRow: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 48, height: 6, borderRadius: 3 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  sheetTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, fontWeight: '700' },
  sheetScroll: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },

  sectionLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 12,
    letterSpacing: 2, marginBottom: 16, fontWeight: '700',
  },

  wordCard: { padding: 20, marginBottom: 24 },
  wordCardOrganic: {
    borderWidth: 1,
    borderRadius: 30,
  },
  wordCardAlt: {
    borderWidth: 1,
    borderRadius: 30,
  },
  wordCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  wordTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, fontWeight: '700' },
  wordDef: { fontFamily: 'Lora_400Regular_Italic', fontSize: 14, marginTop: 4 },

  intensityScale: { marginTop: 24, position: 'relative' },
  intensityLine: {
    position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
  },
  intensityDots: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8,
  },
  intensityDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#FFFFFF',
  },
  intensityDotActive: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  intensityLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  intensityLabelText: { fontFamily: 'Inter_500Medium', fontSize: 10, textTransform: 'uppercase' as any, letterSpacing: -0.3, fontWeight: '500' },

  coreTheme: {
    flexDirection: 'row', gap: 16, padding: 16, borderRadius: 16,
    borderWidth: 1, borderStyle: 'dashed',
    marginBottom: 24,
  },
  coreThemeIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  coreThemeContent: { flex: 1 },
  coreThemeLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1, fontWeight: '700' },
  coreThemeText: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, marginTop: 4, fontWeight: '500' },

  sheetFooter: {
    padding: 24, borderTopWidth: 1, borderTopColor: '#F8FAFC',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
  },
  addBtn: {
    width: '100%', height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  addBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, fontWeight: '700' },
});
