/**
 * 90-day realistic demo data generator for web evaluation.
 * Creates a narrative arc: anxious/settling → growth → gratitude/peace
 * Works on BOTH web (via webDataStore) and native (via SQLite).
 */
import { Platform } from 'react-native';
import { subDays, format } from 'date-fns';
import { webStore } from '../database/webDataStore';

// ── 30+ diverse journal entries covering full emotional range ──
const JOURNAL_ENTRIES = [
  // Phase 1 (Days 1–30): More anxiety, overwhelm, settling in
  { text: "Everything feels heavy today. Work deadlines, family expectations, the constant hum of notifications. I just want silence. Real, deep silence where I can hear my own thoughts again.", emotions: ['overwhelmed', 'anxious'], mood: 3, tags: ['Evening', 'Work'] },
  { text: "Couldn't sleep last night. My mind kept racing through tomorrow's presentation. I wrote down my fears on paper—somehow seeing them shrunk them a little. Still scared though.", emotions: ['anxious', 'tired'], mood: 3, tags: ['Night', 'Work'] },
  { text: "Had a panic attack at the grocery store. The fluorescent lights, the crowds, even choosing between two brands of cereal felt impossible. Sat in my car for twenty minutes before driving home.", emotions: ['anxious', 'overwhelmed'], mood: 2, tags: ['Morning', 'Home'] },
  { text: "Talked to Mom today. She said something that stuck: 'You don't have to figure everything out this week.' Simple, but it cracked something open in me. Maybe I'm putting too much pressure on myself.", emotions: ['content', 'hopeful'], mood: 6, tags: ['Evening', 'Home'] },
  { text: "Rain all day. I sat by the window with tea and just watched. No phone, no music. Just rain. It's the first time in weeks I felt my shoulders drop from around my ears.", emotions: ['peaceful', 'content'], mood: 7, tags: ['Morning', 'Home'] },
  { text: "I snapped at a colleague today and immediately felt sick about it. The stress is leaking out sideways. I need to find a healthier outlet before I push everyone away.", emotions: ['anxious', 'uncertain'], mood: 3, tags: ['Work', 'Evening'] },
  { text: "Started my morning with stretching instead of scrolling. Just 10 minutes. It's small, but my body felt different walking to work. Lighter somehow.", emotions: ['hopeful', 'content'], mood: 6, tags: ['Morning', 'Home'] },
  { text: "The imposter syndrome hit hard today. Everyone in the meeting seemed so confident, so certain. And here I am, wondering if anyone can tell I'm faking it.", emotions: ['anxious', 'uncertain'], mood: 3, tags: ['Work', 'Evening'] },

  // Phase 2 (Days 31–60): Growth, curiosity, mixed emotions
  { text: "I finished the book I've been reading for three months. The ending made me cry—not from sadness, but from recognition. The character's journey mirrored mine in ways I didn't expect.", emotions: ['content', 'curious'], mood: 7, tags: ['Evening', 'Home'] },
  { text: "Walked a new route today. Found a tiny bookshop I never knew existed. Bought a journal with handmade paper. Sometimes getting lost is exactly what you need.", emotions: ['joyful', 'curious'], mood: 8, tags: ['Morning', 'Walk'] },
  { text: "Had a difficult conversation with an old friend. We've been drifting apart for months, and naming it out loud was painful but necessary. Growth isn't always comfortable.", emotions: ['uncertain', 'content'], mood: 5, tags: ['Evening', 'Home'] },
  { text: "Tried meditation for the first time. Fifteen minutes felt like an hour. My mind wandered to groceries, work emails, that weird thing I said in 2019. But there were two seconds of genuine stillness. I'll take it.", emotions: ['curious', 'peaceful'], mood: 6, tags: ['Morning', 'Home'] },
  { text: "Cooked a meal from scratch today. Nothing fancy—just pasta with vegetables. But standing in the kitchen, chopping onions, stirring the sauce... it felt like a small act of self-love.", emotions: ['content', 'peaceful'], mood: 7, tags: ['Evening', 'Home'] },
  { text: "The stars don't just exist to be seen; they exist to remind us that even the smallest light matters in a vast dark sky. Wrote that in my paper journal. Feels true.", emotions: ['hopeful', 'content'], mood: 8, tags: ['Night', 'Home'] },
  { text: "Felt the old anxiety creeping back today. But this time I noticed it earlier—like catching a wave before it crests. I breathed through it. Didn't fix everything, but I didn't drown either.", emotions: ['anxious', 'hopeful'], mood: 5, tags: ['Work', 'Morning'] },
  { text: "A stranger smiled at me on the bus and I smiled back. Such a small thing. But it reminded me that connection doesn't always require words or effort. Sometimes it's just presence.", emotions: ['content', 'joyful'], mood: 7, tags: ['Morning', 'Walk'] },

  // Phase 3 (Days 61–90): More gratitude, peace, reflection
  { text: "Woke up feeling genuinely rested for the first time in weeks. The morning light through the curtains looked almost sacred. I lay there for five minutes just breathing. No rush.", emotions: ['peaceful', 'content'], mood: 8, tags: ['Morning', 'Home'] },
  { text: "I've been journaling for almost three months now. Reading back through old entries is like watching a time-lapse of healing. The person who wrote those first entries was drowning. I'm not drowning anymore.", emotions: ['content', 'hopeful'], mood: 9, tags: ['Evening', 'Home'] },
  { text: "Gratitude list: my warm apartment, the sound of birds at dawn, the friend who texts 'thinking of you' on hard days, the ability to put feelings into words. Simple things. Everything.", emotions: ['content', 'joyful'], mood: 9, tags: ['Morning', 'Home'] },
  { text: "Sat in the park today and watched dogs play. Their pure, unfiltered joy is the most honest thing in the world. I want to approach life with even a fraction of that enthusiasm.", emotions: ['joyful', 'peaceful'], mood: 8, tags: ['Morning', 'Walk'] },
  { text: "Had a setback at work but my first thought wasn't panic—it was 'okay, let's figure this out.' That shift feels enormous. Three months ago I would have spiraled for days.", emotions: ['content', 'hopeful'], mood: 7, tags: ['Work', 'Evening'] },
  { text: "Forgave myself today. For the wasted years, the harsh self-talk, the opportunities I was too afraid to take. I'm here now. That's what matters.", emotions: ['peaceful', 'content'], mood: 9, tags: ['Evening', 'Home'] },
  { text: "The clouds were particularly dramatic today. I found myself thinking about the project at work and realized I was actually excited. When did excited replace dread? I didn't even notice the transition.", emotions: ['curious', 'joyful'], mood: 8, tags: ['Morning', 'Work'] },
  { text: "Made a list of things I want to learn: watercolor painting, bread baking, Portuguese, astronomy. Not because I need to, but because curiosity feels like a luxury I can finally afford.", emotions: ['curious', 'hopeful'], mood: 8, tags: ['Evening', 'Home'] },
  { text: "Quiet evening. Rain on windows. A good book. Nowhere to be. This is enough. I am enough.", emotions: ['peaceful', 'content'], mood: 9, tags: ['Evening', 'Home'] },
  { text: "I realized today that happiness isn't a destination—it's the small moments you choose to notice. The warm cup in your hands. The song that plays at just the right time. The way sunlight moves across a wall.", emotions: ['content', 'joyful'], mood: 9, tags: ['Morning', 'Home'] },
  { text: "Had lunch with a new friend from the meditation group. We talked about vulnerability and she said something beautiful: 'Softness isn't weakness; it's the courage to remain open.' I want to remember that.", emotions: ['hopeful', 'content'], mood: 8, tags: ['Morning', 'Walk'] },
  { text: "Looked through old photos and felt tenderness instead of regret. Progress.", emotions: ['content', 'peaceful'], mood: 8, tags: ['Evening', 'Home'] },
];

const EMOTION_COLORS: Record<string, string> = {
  anxious: '#89ABD4',
  overwhelmed: '#A0B2C6',
  tired: '#D4CFC9',
  content: '#7DBFA7',
  hopeful: '#7DBFA7',
  peaceful: '#F5D769',
  joyful: '#F5D769',
  curious: '#E6A87C',
  uncertain: '#D4CFC9',
};

const PROMPTS = [
  "What's been occupying your mind today?",
  "Describe a moment that made you pause.",
  "If your mood were a weather pattern, what would it be?",
  "What would you tell your yesterday self?",
  "What small thing brought you comfort today?",
  "Write about something you noticed for the first time.",
  "What are you carrying that you could set down?",
  "Describe how your body feels right now.",
];

const PATTERN_INSIGHTS = [
  { type: 'correlation', message: 'Your reflections suggest a consistent rise in **Anxiety** during Sunday evenings, often correlated with thoughts about the upcoming work week.' },
  { type: 'trend', message: 'Morning entries containing the word **"quiet"** are followed by significantly higher overall sentiment scores throughout the day.' },
  { type: 'correlation', message: 'When you use words like **"overwhelmed"**, your sleep quality tends to be lower the next day. A gentle evening wind-down routine might help.' },
  { type: 'trend', message: 'Your vocabulary richness has increased by **23%** over the past month. You\'re finding more nuanced ways to express your emotions.' },
  { type: 'alert', message: 'Entries written after **8 PM** tend to carry more reflective and peaceful tones. Consider protecting this evening journaling time.' },
  { type: 'trend', message: 'You write more frequently on evenings after productive workdays, often expressing feelings of **clarity and calm**.' },
  { type: 'correlation', message: 'Days when you mention **nature** (walking, park, rain, sky) show a 40% higher mood score than average.' },
];

export function seedWebDemoData() {
  if (webStore.isSeeded()) {
    console.log('[Demo] Already seeded, skipping');
    return;
  }

  console.log('[Demo] Seeding 90 days of demo data...');
  webStore.clearAll();

  const today = new Date();
  let entryIdx = 0;

  for (let i = 89; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');

    // 85% chance to have an entry
    if (Math.random() < 0.85) {
      const template = JOURNAL_ENTRIES[entryIdx % JOURNAL_ENTRIES.length];
      entryIdx++;

      const emotions = template.emotions.map(em => ({
        emotion: em,
        score: 0.5 + Math.random() * 0.5,
        color: EMOTION_COLORS[em] || '#A0ADB8',
      }));

      const hour = 7 + Math.floor(Math.random() * 14); // 7am – 9pm
      const minute = Math.floor(Math.random() * 60);
      const createdAt = new Date(d);
      createdAt.setHours(hour, minute, 0, 0);

      webStore.insertEntry({
        date: dateStr,
        created_at: createdAt.toISOString(),
        content: template.text,
        word_count: template.text.split(/\s+/).length,
        detected_emotions: JSON.stringify(emotions),
        dominant_emotion: JSON.stringify(emotions[0]),
        tags: JSON.stringify(template.tags),
        mood_score: template.mood,
        prompt_used: PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
        linguistic_score: JSON.stringify({
          vocabularyScore: 40 + Math.random() * 50,
          absoluteLanguageScore: Math.random() * 0.15,
          pronounDensity: 0.1 + Math.random() * 0.4,
        }),
      });
    }

    // 75% chance for a check-in
    if (Math.random() < 0.75) {
      // Sleep/energy correlate with phase
      let sleepBase: number, energyBase: number;
      if (i >= 60) { sleepBase = 2; energyBase = 2; }       // early: low sleep/energy
      else if (i >= 30) { sleepBase = 3; energyBase = 3; }  // mid: improving
      else { sleepBase = 4; energyBase = 4; }                // late: good

      webStore.insertCheckIn({
        date: dateStr,
        sleep_quality: Math.min(5, Math.max(1, sleepBase + Math.floor(Math.random() * 2 - 0.5))),
        energy_level: Math.min(5, Math.max(1, energyBase + Math.floor(Math.random() * 2 - 0.5))),
        focus: ['Mindfulness', 'Creativity', 'Physical Health', 'Work-Life'][Math.floor(Math.random() * 4)],
        quick_note: '',
        created_at: d.toISOString(),
      });
    }
  }

  // Insert pattern insights
  PATTERN_INSIGHTS.forEach((p, idx) => {
    webStore.insertPattern({
      generated_at: subDays(today, idx * 10).toISOString(),
      insight_type: p.type,
      message: p.message,
      week_start: format(subDays(today, (idx + 1) * 7), 'yyyy-MM-dd'),
    });
  });

  webStore.markSeeded();
  console.log(`[Demo] Seeded ${webStore.getEntryCount()} entries, patterns, and check-ins.`);
}

// Legacy export for native compatibility
export const seedDemoData = async (db: any) => {
  if (Platform.OS === 'web') {
    seedWebDemoData();
    return;
  }
  if (!db) return;

  try {
    console.log('Seeding native demo data...');
    const today = new Date();
    let entryIdx = 0;

    for (let i = 89; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');

      if (Math.random() < 0.85) {
        const template = JOURNAL_ENTRIES[entryIdx % JOURNAL_ENTRIES.length];
        entryIdx++;
        const emotions = template.emotions.map(em => ({
          emotion: em, score: 0.5 + Math.random() * 0.5, color: EMOTION_COLORS[em] || '#A0ADB8',
        }));

        await db.runAsync(
          'INSERT INTO journal_entries (date, created_at, content, word_count, detected_emotions, dominant_emotion, mood_score, tags, linguistic_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            dateStr, d.toISOString(), template.text, template.text.split(/\s+/).length,
            JSON.stringify(emotions), JSON.stringify(emotions[0]), template.mood,
            JSON.stringify(template.tags),
            JSON.stringify({ vocabularyScore: 40 + Math.random() * 50, absoluteLanguageScore: Math.random() * 0.15, pronounDensity: 0.1 + Math.random() * 0.4 }),
          ]
        );
      }

      if (Math.random() < 0.75) {
        let sb: number, eb: number;
        if (i >= 60) { sb = 2; eb = 2; } else if (i >= 30) { sb = 3; eb = 3; } else { sb = 4; eb = 4; }
        await db.runAsync(
          'INSERT INTO daily_checkins (date, sleep_quality, energy_level, created_at) VALUES (?, ?, ?, ?)',
          [dateStr, Math.min(5, Math.max(1, sb + Math.floor(Math.random() * 2 - 0.5))), Math.min(5, Math.max(1, eb + Math.floor(Math.random() * 2 - 0.5))), d.toISOString()]
        );
      }
    }

    PATTERN_INSIGHTS.forEach(async (p, idx) => {
      await db.runAsync(
        'INSERT INTO pattern_insights (generated_at, insight_type, message, week_start) VALUES (?, ?, ?, ?)',
        [subDays(today, idx * 10).toISOString(), p.type, p.message, format(subDays(today, (idx + 1) * 7), 'yyyy-MM-dd')]
      );
    });

    console.log('Native demo data seeded.');
  } catch (error) {
    console.error('Error seeding native demo data:', error);
  }
};
