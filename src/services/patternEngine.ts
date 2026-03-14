import { JournalEntry, CheckIn, PatternInsight } from '../types';

export const generateWeeklyPatterns = (
  entries: JournalEntry[], 
  checkins: CheckIn[] = []
): PatternInsight[] => {
  if (!entries || entries.length === 0) return [];

  const insights: PatternInsight[] = [];
  const today = new Date().toISOString();

  // 1. TEMPORAL PATTERN
  const temporalInsight = analyzeTemporalMood(entries);
  if (temporalInsight) {
    insights.push({
      type: 'temporal',
      message: temporalInsight.message,
      trend: 'stable',
      date: today
    });
  }

  // 2. ABSOLUTE LANGUAGE TREND
  const absoluteInsight = analyzeAbsoluteLanguageTrend(entries);
  if (absoluteInsight) {
    insights.push({
      type: 'language',
      message: absoluteInsight.message,
      trend: absoluteInsight.isIncreasing ? 'up' : 'down',
      date: today
    });
  }

  // 3. SLEEP-MOOD CORRELATION
  if (checkins.length > 0) {
    const sleepMoodInsight = analyzeSleepMoodCorrelation(entries, checkins);
    if (sleepMoodInsight) {
      insights.push({
        type: 'behavioral',
        message: sleepMoodInsight.message,
        trend: 'stable',
        date: today
      });
    }
  }

  // 4. VOCABULARY DIVERSITY
  const vocabInsight = analyzeVocabularyDiversity(entries);
  if (vocabInsight) {
    insights.push({
      type: 'vocabulary',
      message: vocabInsight.message,
      trend: vocabInsight.isGrowing ? 'up' : 'down',
      date: today
    });
  }

  return insights;
};

const analyzeTemporalMood = (entries: JournalEntry[]) => {
  let morningScore = 0, morningCount = 0; // 6-12
  let afternoonScore = 0, afternoonCount = 0; // 12-18
  let eveningScore = 0, eveningCount = 0; // 18-24

  entries.forEach(entry => {
    if (!entry.moodScore) return;
    
    const hour = new Date(entry.createdAt || entry.date).getHours();
    if (hour >= 6 && hour < 12) { morningScore += entry.moodScore; morningCount++; }
    else if (hour >= 12 && hour < 18) { afternoonScore += entry.moodScore; afternoonCount++; }
    else { eveningScore += entry.moodScore; eveningCount++; }
  });

  const mAvg = morningCount > 0 ? morningScore / morningCount : 0;
  const aAvg = afternoonCount > 0 ? afternoonScore / afternoonCount : 0;
  const eAvg = eveningCount > 0 ? eveningScore / eveningCount : 0;

  if (mAvg > aAvg && mAvg > eAvg && mAvg > 6) {
    return { message: "Your mood tends to be highest in the mornings." };
  } else if (eAvg > mAvg && eAvg > aAvg && eAvg > 6) {
    return { message: "You generally feel more at peace during the evenings." };
  }
  return null;
};

const analyzeAbsoluteLanguageTrend = (entries: JournalEntry[]) => {
  // Split entries into this week and last week
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sorted.length < 4) return null; // Need enough data

  // Very naive split for hackathon: first half vs second half
  const mid = Math.floor(sorted.length / 2);
  const recent = sorted.slice(0, mid);
  const older = sorted.slice(mid);

  const getAvgAbsolute = (arr: JournalEntry[]) => {
    const total = arr.reduce((sum, e) => sum + (e.linguisticScore?.absoluteLanguage || 0), 0);
    return total / arr.length;
  };

  const recentAvg = getAvgAbsolute(recent);
  const olderAvg = getAvgAbsolute(older);

  if (recentAvg > olderAvg && recentAvg > 0.1) {
    return { 
      message: "You've been using more absolute words ('never', 'always') recently. It's okay to find the gray areas.",
      isIncreasing: true
    };
  } else if (recentAvg < olderAvg && olderAvg > 0.1) {
    return { 
      message: "You're writing with more nuance and flexibility compared to last week. Great self-reflection.",
      isIncreasing: false
    };
  }
  return null;
};

const analyzeSleepMoodCorrelation = (entries: JournalEntry[], checkins: CheckIn[]) => {
  let goodSleepMoodScore = 0, goodSleepCount = 0;
  let poorSleepMoodScore = 0, poorSleepCount = 0;

  entries.forEach(entry => {
    if (!entry.moodScore) return;
    const dateStr = entry.date.split('T')[0];
    const checkin = checkins.find(c => c.date === dateStr);
    
    if (checkin) {
      if (checkin.sleepQuality > 3.5) {
        goodSleepMoodScore += entry.moodScore;
        goodSleepCount++;
      } else if (checkin.sleepQuality < 2.5) {
        poorSleepMoodScore += entry.moodScore;
        poorSleepCount++;
      }
    }
  });

  const avgGoodSleepMood = goodSleepCount > 0 ? goodSleepMoodScore / goodSleepCount : null;
  const avgPoorSleepMood = poorSleepCount > 0 ? poorSleepMoodScore / poorSleepCount : null;

  if (avgGoodSleepMood && avgPoorSleepMood && (avgGoodSleepMood - avgPoorSleepMood > 1.5)) {
    return { message: "There is a strong connection between your sleep quality and your mood the next day." };
  }
  return null;
};

const analyzeVocabularyDiversity = (entries: JournalEntry[]) => {
  const allTags = new Set(entries.flatMap(e => e.tags || []));
  
  if (allTags.size > 8) {
    return {
      message: "Your emotional vocabulary is expanding! You used widely varied words to describe your feelings this week.",
      isGrowing: true
    };
  }
  return null;
};
