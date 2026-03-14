import { Platform } from 'react-native';
const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

export const initDatabase = async (db: any) => {
  if (Platform.OS === 'web' || !db) {
    console.log('[Web] Skipping native database initialization');
    return;
  }
  try {
    // Journal Entries Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        content TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        detected_emotions TEXT,
        dominant_emotion TEXT,
        tags TEXT,
        mood_score REAL,
        prompt_used TEXT,
        linguistic_score TEXT
      );
    `);

    // Daily Check-ins Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        sleep_quality REAL,
        energy_level INTEGER,
        social_connection TEXT,
        one_word TEXT,
        created_at TEXT
      );
    `);

    // Emotion Vocabulary Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS emotion_vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        basic_emotion TEXT,
        richer_word TEXT,
        definition TEXT,
        intensity_level INTEGER,
        plutchik_category TEXT
      );
    `);

    // App Settings Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Pattern Insights Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pattern_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        generated_at TEXT,
        insight_type TEXT,
        message TEXT,
        supporting_data TEXT,
        week_start TEXT
      );
    `);

    // Add Performance Indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
      CREATE INDEX IF NOT EXISTS idx_checkin_date ON daily_checkins(date);
    `);

    // Seed Emotion Vocabulary if empty
    const result = await db.getAllAsync(
      'SELECT COUNT(*) as count FROM emotion_vocabulary'
    );
    
    if (result && result.length > 0 && result[0].count === 0) {
      await seedEmotionVocabulary(db);
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

const seedEmotionVocabulary = async (db: any) => {
  const seeds = [
    // Sad
    { basic: 'sad', richer: 'melancholic', def: 'A feeling of pensive sadness, typically with no obvious cause', int: 2, cat: 'Sadness' },
    { basic: 'sad', richer: 'hollow', def: 'Feeling empty inside, lacking emotional substance', int: 3, cat: 'Sadness' },
    { basic: 'sad', richer: 'wistful', def: 'Having or showing a feeling of vague or regretful longing', int: 1, cat: 'Sadness' },
    { basic: 'sad', richer: 'forlorn', def: 'Pitifully sad and abandoned or lonely', int: 3, cat: 'Sadness' },
    { basic: 'sad', richer: 'subdued', def: 'Quiet and rather reflective or depressed', int: 1, cat: 'Sadness' },
    // Happy
    { basic: 'happy', richer: 'elated', def: 'Ecstatically happy', int: 3, cat: 'Joy' },
    { basic: 'happy', richer: 'radiant', def: 'Sending out light; shining or glowing brightly with joy and hope', int: 2, cat: 'Joy' },
    { basic: 'happy', richer: 'content', def: 'In a state of peaceful happiness', int: 1, cat: 'Joy' },
    { basic: 'happy', richer: 'jubilant', def: 'Feeling or expressing great happiness and triumph', int: 3, cat: 'Joy' },
    { basic: 'happy', richer: 'at peace', def: 'Free from anxiety or distress', int: 1, cat: 'Joy' },
    // Angry
    { basic: 'angry', richer: 'frustrated', def: 'Feeling or expressing distress and annoyance', int: 2, cat: 'Anger' },
    { basic: 'angry', richer: 'agitated', def: 'Feeling or appearing troubled or nervous', int: 2, cat: 'Anger' },
    { basic: 'angry', richer: 'tense', def: 'Unable to relax because of nervousness, anxiety, or stimulation', int: 1, cat: 'Anger' },
    { basic: 'angry', richer: 'unsettled', def: 'Lacking stability, uncertain or anxious', int: 1, cat: 'Anger' },
    { basic: 'angry', richer: 'irritable', def: 'Having or showing a tendency to be easily annoyed or made angry', int: 2, cat: 'Anger' },
    // Scared
    { basic: 'scared', richer: 'apprehensive', def: 'Anxious or fearful that something bad or unpleasant will happen', int: 2, cat: 'Fear' },
    { basic: 'scared', richer: 'uneasy', def: 'Causing or feeling anxiety; troubled or uncomfortable', int: 1, cat: 'Fear' },
    { basic: 'scared', richer: 'anxious', def: 'Experiencing worry, unease, or nervousness', int: 2, cat: 'Fear' },
    { basic: 'scared', richer: 'unsettled', def: 'Lacking stability; uncertain', int: 1, cat: 'Fear' },
    { basic: 'scared', richer: 'on edge', def: 'Tense, nervous, or irritable', int: 2, cat: 'Fear' },
    // Tired
    { basic: 'tired', richer: 'depleted', def: 'Diminished in number or quantity; exhausted', int: 3, cat: 'Fatigue' },
    { basic: 'tired', richer: 'drained', def: 'Deprived of strength or vitality', int: 2, cat: 'Fatigue' },
    { basic: 'tired', richer: 'weary', def: 'Feeling or showing tiredness, especially as a result of excessive exertion', int: 2, cat: 'Fatigue' },
    { basic: 'tired', richer: 'burned out', def: 'Ruinous from overwork or stress', int: 3, cat: 'Fatigue' },
    { basic: 'tired', richer: 'heavy', def: 'Feeling physically or emotionally weighed down', int: 2, cat: 'Fatigue' },
    // Confused
    { basic: 'confused', richer: 'unsettled', def: 'Lacking stability, uncertain or anxious', int: 1, cat: 'Confusion' },
    { basic: 'confused', richer: 'adrift', def: 'Without purpose, direction, or guidance', int: 2, cat: 'Confusion' },
    { basic: 'confused', richer: 'scattered', def: 'Disorganized and lacking concentration', int: 2, cat: 'Confusion' },
    { basic: 'confused', richer: 'turbulent', def: 'Characterized by conflict, disorder, or confusion', int: 3, cat: 'Confusion' },
    { basic: 'confused', richer: 'murky', def: 'Not fully explained or understood, dark and gloomy', int: 1, cat: 'Confusion' },
  ];

  try {
    for (const word of seeds) {
      await db.runAsync(
        'INSERT INTO emotion_vocabulary (basic_emotion, richer_word, definition, intensity_level, plutchik_category) VALUES (?, ?, ?, ?, ?)',
        [word.basic, word.richer, word.def, word.int, word.cat]
      );
    }
    console.log(`✅ Seeded ${seeds.length} emotion words`);
  } catch (error) {
    console.error('❌ Error seeding vocabulary:', error);
  }
};
