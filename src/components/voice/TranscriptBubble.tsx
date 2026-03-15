import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

interface TranscriptBubbleProps {
  text: string;
  sender: 'user' | 'sage';
  emotion?: string;
  theme: {
    card: string;
    textMain: string;
    textMuted: string;
    primary: string;
    isDark: boolean;
  };
}

const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊',
  sadness: '😢',
  anger: '😤',
  fear: '😰',
  disgust: '🤢',
  surprise: '😮',
  neutral: '🤍',
};

const EMOTION_COLOR: Record<string, string> = {
  joy: '#F0C070',
  sadness: '#89ABD4',
  anger: '#D4896A',
  fear: '#C4A4C0',
  disgust: '#A8B8B0',
  surprise: '#F0B87C',
  neutral: '#A8B8C8',
};

export default function TranscriptBubble({ text, sender, emotion, theme }: TranscriptBubbleProps) {
  const isUser = sender === 'user';
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;
  const maxBubbleWidth = isNarrow ? '92%' : '80%';

  const emotionEmoji = emotion ? (EMOTION_EMOJI[emotion] || '🤍') : '';
  const emotionColor = emotion ? (EMOTION_COLOR[emotion] || EMOTION_COLOR.neutral) : theme.primary;

  return (
    <View style={[styles.wrapper, { maxWidth: maxBubbleWidth }, isUser ? styles.userWrapper : styles.sageWrapper]}>
      {!isUser && (
        <View style={styles.sageHeader}>
          <View style={[styles.sageDot, { backgroundColor: emotionColor }]} />
          <Text style={[styles.sageName, { color: emotionColor }]}>Sage</Text>
          {emotion && (
            <View style={[styles.emotionBadge, { backgroundColor: emotionColor + '20' }]}>
              <Text style={[styles.emotionText, { color: emotionColor }]}>
                {emotionEmoji} {emotion}
              </Text>
            </View>
          )}
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '30' }]
            : [styles.sageBubble, { backgroundColor: theme.isDark ? '#FFFFFF0D' : '#F8FAFC', borderColor: theme.isDark ? '#FFFFFF15' : '#E2E8F0' }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: theme.textMain },
            isUser ? styles.userText : styles.sageText,
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    flexShrink: 1,
    minWidth: 60,
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  sageWrapper: {
    alignSelf: 'flex-start',
  },
  sageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    marginLeft: 4,
    flexWrap: 'wrap',
  },
  sageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sageName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
  },
  emotionBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  emotionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    flexShrink: 1,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  sageBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  userText: {
    fontFamily: 'Inter_400Regular',
  },
  sageText: {
    fontFamily: 'Lora_400Regular',
  },
});
