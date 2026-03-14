import { EmotionData } from '../types';

export interface EmotionAnalysis {
  emotions: EmotionData[];
  dominantEmotion: string;
  dominantColor: string;
  linguisticMarkers: {
    absoluteLanguageScore: number;
    firstPersonDensity: number;
    negativeRatio: number;
    vocabularyDiversity: number;
    averageSentenceLength: number;
  };
  wordSuggestions: string[];
  reflectionPrompt: string;
}

const HF_API_URL = 'https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base';

// Map HF emotions to our design system
const EMOTION_COLORS: Record<string, string> = {
  joy: '#F0C070',
  sadness: '#89ABD4',
  anger: '#D4896A',
  fear: '#C4A4C0',
  disgust: '#A8B8B0',
  surprise: '#F0B87C',
  neutral: '#A8B8C8',
};

// Rate limiting state
let lastApiCallTime = 0;
const RATE_LIMIT_MS = 5000;

export const analyzeText = async (text: string, hfApiKey?: string): Promise<EmotionAnalysis> => {
  if (!text.trim()) {
    throw new Error('Empty text provided for analysis');
  }

  const markers = calculateLinguisticMarkers(text);
  let emotions: EmotionData[] = [];

  // Enforce rate limiting + require API key
  const timeSinceLastCall = Date.now() - lastApiCallTime;
  
  if (hfApiKey && timeSinceLastCall >= RATE_LIMIT_MS) {
    try {
      lastApiCallTime = Date.now();
      emotions = await fetchHuggingFaceEmotions(text, hfApiKey);
    } catch (error) {
      console.warn('⚠️ HF API failed, falling back to local lexicon:', error);
      emotions = localLexiconFallback(text);
    }
  } else {
    // If rate limited or no API key, use local immediate fallback
    emotions = localLexiconFallback(text);
  }

  const dominantEmotionData = emotions.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );

  return {
    emotions,
    dominantEmotion: dominantEmotionData.emotion,
    dominantColor: dominantEmotionData.color,
    linguisticMarkers: markers,
    // Note: Word suggestions and Reflection prompts should ideally be fetched/generated 
    // integrating with the DB and full app context. For this service, we mock/generate locally.
    wordSuggestions: generateWordSuggestions(dominantEmotionData.emotion),
    reflectionPrompt: generateReflectionPrompt(dominantEmotionData.emotion, markers)
  };
};

const fetchHuggingFaceEmotions = async (text: string, apiKey: string): Promise<EmotionData[]> => {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text.substring(0, 500) }) // HF limit
  });

  if (!response.ok) {
    throw new Error(`HF API Error: ${response.status}`);
  }

  const data = await response.json();
  // HF returns: [[{label: 'joy', score: 0.9}, ...]]
  const results: Array<{label: string, score: number}> = data[0];
  
  return results.map(r => ({
    emotion: r.label,
    score: r.score,
    color: EMOTION_COLORS[r.label] || EMOTION_COLORS.neutral
  }));
};

const calculateLinguisticMarkers = (text: string) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const totalWords = words.length;
  
  if (totalWords === 0) {
    return {
      absoluteLanguageScore: 0,
      firstPersonDensity: 0,
      negativeRatio: 0,
      vocabularyDiversity: 0,
      averageSentenceLength: 0
    };
  }

  const absoluteWords = new Set(['always', 'never', 'nothing', 'nobody', 'everyone', 'everything', 'completely', 'totally', 'impossible', 'ruined']);
  const firstPersonWords = new Set(['i', 'me', 'my', 'myself', 'mine']);
  const negativeWords = new Set(['bad', 'sad', 'terrible', 'awful', 'hate', 'angry', 'fail', 'stupid', 'worst', 'poor', 'alone']);

  let absoluteCount = 0;
  let firstPersonCount = 0;
  let negativeCount = 0;
  const uniqueWords = new Set<string>();

  words.forEach(word => {
    if (absoluteWords.has(word)) absoluteCount++;
    if (firstPersonWords.has(word)) firstPersonCount++;
    if (negativeWords.has(word)) negativeCount++;
    uniqueWords.add(word);
  });

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  return {
    absoluteLanguageScore: absoluteCount / totalWords,
    firstPersonDensity: firstPersonCount / totalWords,
    negativeRatio: negativeCount / totalWords,
    vocabularyDiversity: uniqueWords.size / totalWords,
    averageSentenceLength: totalWords / sentences.length
  };
};

const localLexiconFallback = (text: string): EmotionData[] => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Very simplified 200-word fallback lexicon
  const lexicon: Record<string, string[]> = {
    joy: ['happy', 'great', 'good', 'excited', 'love', 'amazing', 'brilliant', 'smile', 'laugh', 'peaceful'],
    sadness: ['sad', 'cry', 'down', 'depressed', 'lonely', 'miss', 'grief', 'tears', 'heartbreak', 'empty'],
    anger: ['angry', 'mad', 'hate', 'furious', 'annoyed', 'frustrated', 'rage', 'stupid', 'idiot', 'irritated'],
    fear: ['scared', 'afraid', 'terrified', 'anxious', 'nervous', 'worry', 'panic', 'dread', 'horror', 'stress'],
    disgust: ['gross', 'disgusting', 'awful', 'terrible', 'sick', 'nausea', 'vile', 'revolting', 'yuck', 'nasty'],
    surprise: ['wow', 'shocked', 'sudden', 'unexpected', 'amazed', 'stunning', 'gasp', 'unbelievable', 'startled', 'whoa']
  };

  const scores: Record<string, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0, surprise: 0, neutral: 1 };
  
  words.forEach(word => {
    for (const [emotion, triggerWords] of Object.entries(lexicon)) {
      if (triggerWords.includes(word)) {
        scores[emotion] += 1;
        scores.neutral = 0; // if we found any emotion, lower neutral
      }
    }
  });

  const totalHits = Object.values(scores).reduce((a, b) => a + b, 0);
  
  return Object.entries(scores).map(([emotion, rawScore]) => ({
    emotion,
    score: totalHits > 0 ? (rawScore / totalHits) : (emotion === 'neutral' ? 1 : 0),
    color: EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral
  })).sort((a, b) => b.score - a.score); // sort by highest score
};

const generateReflectionPrompt = (dominantEmotion: string, markers: any): string => {
  if (markers.absoluteLanguageScore > 0.15) {
    return "You used some all-or-nothing words — what would a middle ground look like?";
  }

  if (markers.firstPersonDensity > 0.3) {
    return "You're deeply focused inwardly right now. If a good friend had written this, what would you tell them?";
  }

  switch (dominantEmotion) {
    case 'sadness': return "What's one small thing that felt okay today?";
    case 'fear': return "What's the worst that could happen, and how likely is it really?";
    case 'anger': return "Where do you feel this tension in your body? Can you soften it just 5%?";
    case 'joy': return "What allowed you to feel this way, and how can you invite more of it?";
    case 'disgust': return "What boundary feels crossed right now?";
    default: return "If this moment had a color, what would it be and why?";
  }
};

const generateWordSuggestions = (dominantEmotion: string): string[] => {
  // Mocking DB fetch for word suggestions to keep service isolated
  const dbMocks: Record<string, string[]> = {
    sadness: ['melancholic', 'hollow', 'wistful', 'forlorn', 'subdued'],
    joy: ['elated', 'radiant', 'content', 'jubilant', 'at peace'],
    anger: ['frustrated', 'agitated', 'tense', 'unsettled', 'irritable'],
    fear: ['apprehensive', 'uneasy', 'anxious', 'unsettled', 'on edge'],
  };
  return dbMocks[dominantEmotion] || ['Present', 'Observant', 'Grounded'];
};
