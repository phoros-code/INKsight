import { Platform } from 'react-native';
import { subDays } from 'date-fns';

const LOREM_ENTRIES = [
  "I've been feeling so overwhelmed with work lately. Everything seems to be piling up and I just want to escape. But at the same time, I know I need to push through. Finding balance is hard.",
  "Had a surprisingly good day today. The sun was out, ran into an old friend, and just felt... light. I hope this feeling stays.",
  "Still feeling a bit anxious about the upcoming changes. It's difficult not knowing what to expect. Trying to focus on what I can control, but my mind keeps wandering.",
  "Taking a step back today. Did some deep breathing, went for a long walk. It helps to disconnect from the screens and just be.",
  "Woke up feeling completely drained. Didn't sleep well at all. My head is cloudy and I just want this day to end so I can restart tomorrow.",
  "Accomplished a huge milestone today! I feel so proud of myself for sticking with it even when it got difficult. Celebrating this small win.",
  "Feeling adrift. Not sure if I'm on the right path. Need to spend some time re-evaluating my goals and what actually makes me happy.",
  "A quiet evening. Listening to some rain outside. It's peaceful. I feel content and settled for the first time in weeks."
];

const EMOTION_POOL = [
  { emotion: 'anxious', color: '#89ABD4', score: 0.8 },
  { emotion: 'content', color: '#F5D769', score: 0.9 },
  { emotion: 'exhausted', color: '#A0B2C6', score: 0.85 },
  { emotion: 'hopeful', color: '#7DBFA7', score: 0.75 },
  { emotion: 'overwhelmed', color: '#89ABD4', score: 0.9 },
  { emotion: 'peaceful', color: '#F5D769', score: 0.8 },
  { emotion: 'uncertain', color: '#D4CFC9', score: 0.6 },
  { emotion: 'joyful', color: '#F5D769', score: 0.9 }
];

export const seedDemoData = async (db: any) => {
  if (Platform.OS === 'web' || !db) {
    console.log('[Web] Skipping demo data seeding');
    return;
  }
  try {
    console.log('Seeding demo data...');
    const today = new Date();

    // Generate 30 days of entries
    for (let i = 29; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = d.toISOString().split('T')[0];

      // 80% chance to have an entry on a given day
      if (Math.random() > 0.2) {
        const text = LOREM_ENTRIES[Math.floor(Math.random() * LOREM_ENTRIES.length)];
        const emotion = EMOTION_POOL[Math.floor(Math.random() * EMOTION_POOL.length)];
        
        await db.runAsync(
          'INSERT INTO journal_entries (date, created_at, content, word_count, detected_emotions, dominant_emotion, mood_score, linguistic_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            dateStr,
            d.toISOString(),
            text,
            text.split(' ').length,
            JSON.stringify([emotion]),
            JSON.stringify(emotion),
            ['content', 'hopeful', 'peaceful', 'joyful'].includes(emotion.emotion) ? 8 : 4,
            JSON.stringify({
              vocabularyScore: Math.random() * 80 + 20,
              absoluteLanguageScore: Math.random() * 0.15,
              pronounDensity: Math.random() * 0.5
            })
          ]
        );
      }

      // Check-ins (random 70% chance)
      if (Math.random() > 0.3) {
        await db.runAsync(
          'INSERT INTO daily_checkins (date, sleep_quality, energy_level, created_at) VALUES (?, ?, ?, ?)',
          [
            dateStr,
            Math.floor(Math.random() * 5) + 1,
            Math.floor(Math.random() * 5) + 1,
            d.toISOString()
          ]
        );
      }
    }

    // Generate a Pattern
    await db.runAsync(
      'INSERT INTO pattern_insights (generated_at, insight_type, message, week_start) VALUES (?, ?, ?, ?)',
      [
        today.toISOString(),
        'correlation',
        'When you use words like "overwhelmed", your sleep quality tends to be lower the next day. A gentle evening wind-down routine might help.',
        subDays(today, 6).toISOString().split('T')[0]
      ]
    );

    console.log('Demo data seeded successfully.');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};
