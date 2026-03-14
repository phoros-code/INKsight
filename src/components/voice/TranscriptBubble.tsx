import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

export default function TranscriptBubble({ text, sender, emotion, theme }: TranscriptBubbleProps) {
  const isUser = sender === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.userWrapper : styles.sageWrapper]}>
      {!isUser && (
        <View style={styles.sageHeader}>
          <View style={[styles.sageDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.sageName, { color: theme.primary }]}>Sage</Text>
          {emotion && (
            <View style={[styles.emotionBadge, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.emotionText, { color: theme.primary }]}>{emotion}</Text>
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
    maxWidth: '85%',
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
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  emotionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
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
  },
  userText: {
    fontFamily: 'Inter_400Regular',
  },
  sageText: {
    fontFamily: 'Lora_400Regular',
  },
});
