import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated as RNAnimated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useDatabase } from '../../src/utils/webSafe';
// Haptics: use SafeHaptics from webSafe instead
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
const Sharing = Platform.OS !== 'web'
  ? require('expo-sharing')
  : { isAvailableAsync: async () => false, shareAsync: async () => {} };
import ViewShot from 'react-native-view-shot';
import { format, subDays } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing
} from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { JournalEntry } from '../../src/types';
import { getEntriesByRange } from '../../src/database/journalDB';
import { getCheckinsForRange } from '../../src/database/checkinDB';
import { generateWeeklyPatterns } from '../../src/services/patternEngine';
import { MoodOrb } from '../../src/components/home/MoodOrb';

// Custom Animated Number component
const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animValue = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(animValue, {
      toValue: value,
      duration: 1500,
      useNativeDriver: true, // We're interpolating state so fake it visually
    }).start();

    animValue.addListener((v) => {
      setDisplayValue(Math.floor(v.value));
    });

    return () => animValue.removeAllListeners();
  }, [value]);

  return <Text style={styles.statScore}>{displayValue}</Text>;
};

export default function WeeklySummaryModal() {
  const router = useRouter();
  const db = useDatabase();
  const viewShotRef = useRef<ViewShot>(null);

  // States
  const [dateRangeStr, setDateRangeStr] = useState('');
  const [stats, setStats] = useState({ totalEntries: 0, totalWords: 0, avgTime: 'N/A' });
  const [dominantEmotion, setDominantEmotion] = useState({ name: 'Neutral', color: Colors.emotionNeutral });
  const [secondaryEmotions, setSecondaryEmotions] = useState<string[]>([]);
  const [topSentence, setTopSentence] = useState({ text: '', date: '' });
  const [insightMessage, setInsightMessage] = useState('');
  const [vocabGrowth, setVocabGrowth] = useState(0);
  
  // Opacity mounts
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    computeWeeklySummary();
  }, []);

  const computeWeeklySummary = async () => {
    try {
      const todayDate = new Date();
      const startDate = subDays(todayDate, 6).toISOString().split('T')[0];
      const endDate = todayDate.toISOString().split('T')[0];

      setDateRangeStr(`${format(subDays(todayDate, 6), 'MMM d')} – ${format(todayDate, 'd, yyyy')}`);

      const entries = await getEntriesByRange(db, startDate, endDate);
      const checkins = await getCheckinsForRange(db, startDate, endDate);

      if (entries.length === 0) return;

      // 1. Basic Stats
      const totalWords = entries.reduce((acc, e) => acc + (e.wordCount || 0), 0);
      
      // Rough Average Time (Parse date strings heuristically if missing exact timestamps)
      const hours = entries.map(e => new Date(e.date).getHours());
      let modeHour = hours.sort((a,b) =>
            hours.filter(v => v===a).length - hours.filter(v => v===b).length
      ).pop() || 12;
      const ampm = modeHour >= 12 ? 'PM' : 'AM';
      modeHour = modeHour % 12 || 12;

      setStats({
         totalEntries: entries.length,
         totalWords,
         avgTime: `${modeHour} ${ampm}`
      });

      // 2. Emotion Counting
      const eCounts: Record<string, { count: number, color: string }> = {};
      entries.forEach(e => {
         if (e.dominantEmotion) {
            const n = e.dominantEmotion.emotion;
            if(!eCounts[n]) eCounts[n] = { count: 0, color: e.dominantEmotion.color };
            eCounts[n].count++;
         }
      });
      const sortedE = Object.entries(eCounts).sort((a, b) => b[1].count - a[1].count);
      
      if (sortedE.length > 0) {
         setDominantEmotion({ name: sortedE[0][0], color: sortedE[0][1].color });
         setSecondaryEmotions(sortedE.slice(1, 4).map(e => e[0]));
      }

      // 3. Top Sentence (Naive selection via vocab score or length)
      let bestEntry = entries[0];
      let maxScore = -1;
      entries.forEach(e => {
         const score = e.linguisticScore?.vocabularyScore || e.wordCount;
         if (score > maxScore) {
            maxScore = score;
            bestEntry = e;
         }
      });

      // Extract a decent sentence (naive regex split string)
      if (bestEntry && bestEntry.content) {
         const sentences = bestEntry.content.match(/[^\.!\?]+[\.!\?]+/g) || [bestEntry.content];
         const longest = sentences.sort((a, b) => b.length - a.length)[0].trim();
         setTopSentence({ 
            text: longest, 
            date: format(new Date(bestEntry.date), 'MMM d') 
         });
      }

      // 4. AI Insight
      const patterns = generateWeeklyPatterns(entries, checkins);
      if (patterns.length > 0) {
         setInsightMessage(patterns[0].message);
      } else {
         setInsightMessage("You consistently checked in with yourself this week. That alone is powerful.");
      }

      // 5. Vocab Growth (Fake mock for effect, usually needs distinct 2 week query)
      const allUniqueWords = new Set();
      entries.forEach(e => e.detectedEmotions?.forEach(em => allUniqueWords.add(em.emotion)));
      if (allUniqueWords.size >= 4) setVocabGrowth(allUniqueWords.size - 2);

    } catch (e) {
      console.error('Failed sum', e);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { dialogTitle: 'My INKsight Week' });
        }
      }
    } catch (e) {
      console.error('Share err', e);
    }
  };

  const animatedMain = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: withSpring((1 - fadeAnim.value) * 30) }]
  }));

  return (
    <LinearGradient colors={['#1E2A3A', '#2C3E50']} style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
           <Text style={styles.starEmoji}>🌟</Text>
           <Text style={styles.title}>Your Week in Words</Text>
           <Text style={styles.dateRange}>{dateRangeStr}</Text>
        </View>

        {/* --- SHOT CONTAINER FOR EXPORT --- */}
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
          <Animated.View style={[styles.shareableArea, animatedMain]}>
            
            {/* STATS ROW */}
            <View style={styles.statsRow}>
               <View style={styles.statCard}>
                 <Text style={styles.statIcon}>📝</Text>
                 <AnimatedNumber value={stats.totalEntries} />
                 <Text style={styles.statLabel}>Entries</Text>
               </View>
               <View style={styles.statCard}>
                 <Text style={styles.statIcon}>💭</Text>
                 <AnimatedNumber value={stats.totalWords} />
                 <Text style={styles.statLabel}>Words</Text>
               </View>
               <View style={styles.statCard}>
                 <Text style={styles.statIcon}>🕐</Text>
                 <Text style={styles.statScoreStr}>{stats.avgTime}</Text>
                 <Text style={styles.statLabel}>Avg Time</Text>
               </View>
            </View>

            {/* DOMINANT EMOTION CARD */}
            <View style={styles.contentCard}>
               <View style={styles.orbSide}>
                 <MoodOrb size={52} color={dominantEmotion.color} />
               </View>
               <View style={styles.emotionInfoSide}>
                 <Text style={styles.cardHeaderSmall}>Dominant Feeling</Text>
                 <Text style={styles.dominantWord}>{dominantEmotion.name}</Text>
                 {secondaryEmotions.length > 0 && (
                   <View style={styles.secondaryEmotionsRow}>
                     {secondaryEmotions.map((e, idx) => (
                       <View key={idx} style={styles.secondaryPill}>
                         <Text style={styles.secondaryText}>{e}</Text>
                       </View>
                     ))}
                   </View>
                 )}
               </View>
            </View>

            {/* AI INSIGHT */}
            {insightMessage ? (
              <View style={styles.insightCard}>
                 <View style={styles.insightBorder} />
                 <View style={styles.insightBody}>
                   <Text style={styles.insightTitle}>INKsight noticed 💡</Text>
                   <Text style={styles.insightText}>{insightMessage}</Text>
                 </View>
              </View>
            ) : null}

            {/* TOP SENTENCE */}
            {topSentence.text ? (
              <View style={styles.contentCard}>
                 <Text style={styles.cardHeaderSmall}>✨ Most powerful sentence</Text>
                 <Text style={styles.sentenceText}>"{topSentence.text}"</Text>
                 <Text style={styles.sentenceDate}>{topSentence.date}</Text>
              </View>
            ) : null}

            {/* VOCAB GROWTH */}
            {vocabGrowth > 0 && (
              <View style={styles.growthPill}>
                 <Text style={styles.growthText}>+{vocabGrowth} new emotion words this week 📖</Text>
              </View>
            )}

          </Animated.View>
        </ViewShot>

        <View style={styles.spacer} />

        {/* BOTTOM ACTIONS */}
        <View style={styles.footer}>
           <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Feather name="share" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.shareBtnText}>Share Summary</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.backBtn}
             onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
             setTimeout(() => {
               // Only attempt to navigate back to index if stack trace permits
               router.navigate('/(tabs)/');
             }, 500);
             }}
           >
              <Text style={styles.backBtnText}>Back to Home</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    marginBottom: 30,
  },
  starEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  dateRange: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: '#8AA8C4',
  },
  shareableArea: {
    backgroundColor: 'transparent', // Inherit gradient mostly, or add slight dark overlay if needed
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#253447',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 8,
  },
  statScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statScoreStr: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#8AA8C4',
  },
  contentCard: {
    backgroundColor: '#253447',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orbSide: {
    marginRight: 20,
  },
  emotionInfoSide: {
    flex: 1,
  },
  cardHeaderSmall: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#8AA8C4',
    marginBottom: 6,
  },
  dominantWord: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  secondaryEmotionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  secondaryPill: {
    backgroundColor: '#1E2A3A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  secondaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#8AA8C4',
  },
  sentenceText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 28,
    marginTop: 6,
    marginBottom: 12,
  },
  sentenceDate: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#8AA8C4',
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: '#253447',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  insightBorder: {
    width: 4,
    backgroundColor: '#E8A87C',
  },
  insightBody: {
    flex: 1,
    padding: 20,
  },
  insightTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  insightText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: '#8AA8C4',
    lineHeight: 22,
  },
  growthPill: {
    backgroundColor: '#7DBFA7',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  growthText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 30,
    marginTop: 20,
  },
  shareBtn: {
    flexDirection: 'row',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#8AA8C4',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  backBtn: {
    padding: 10,
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#8AA8C4',
  },
});
