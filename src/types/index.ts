export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  detectedEmotions: EmotionData[];
  wordCount: number;
  tags: string[];
  dominantEmotion?: EmotionData;
  moodScore?: number;
  promptUsed?: string;
  linguisticScore?: {
    absoluteLanguage: number;
    pronounDensity: number;
    vocabularyScore: number;
  };
}

export interface EmotionData {
  emotion: string;
  score: number;
  color: string;
}

export interface CheckIn {
  date: string;
  sleepQuality: number; // 1-5 scale
  energyLevel: number; // 1-5 scale
  socialConnection: number; // 1-5 scale
  oneWord: string;
}

export interface PatternInsight {
  type: 'trend' | 'correlation' | 'alert';
  message: string;
  trend: 'up' | 'down' | 'stable';
  date: string;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  entries: number;
  dominantEmotion: EmotionData;
  topSentence: string;
}
