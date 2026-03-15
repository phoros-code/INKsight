import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/ThemeContext';
import VoiceOrb, { OrbState } from './VoiceOrb';
import TranscriptBubble from './TranscriptBubble';
import * as VoiceAgent from '../../services/voiceAgentService';
import * as nlpService from '../../services/nlpService';
import * as journalDB from '../../database/journalDB';

// ── Types ────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'sage';
  emotion?: string;
  timestamp: Date;
}


// ── Component ────────────────────────────────────────────────
export default function VoiceAgentScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [statusText, setStatusText] = useState('Tap the orb to speak');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const recordingRef = useRef<any>(null);

  // Responsive flags
  const isNarrow = screenWidth < 480;
  const isShort = screenHeight < 600;

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // ── Check server health ──────────────────────────────────
  const checkServer = useCallback(async () => {
    try {
      const health = await VoiceAgent.checkHealth();
      setServerOnline(health.status === 'ok');
      return true;
    } catch {
      setServerOnline(false);
      setStatusText('⚠️ Server offline. Start the voice-agent-server.');
      return false;
    }
  }, []);

  React.useEffect(() => {
    checkServer();
  }, [checkServer]);

  // ── Build conversation history for context ────────────────
  const getConversationHistory = useCallback(() => {
    // Send the last 6 messages for context
    return messages.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      text: m.text,
    }));
  }, [messages]);

  // ── Add message helper ───────────────────────────────────
  const addMessage = useCallback((text: string, sender: 'user' | 'sage', emotion?: string) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      text,
      sender,
      emotion,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
    return msg;
  }, [scrollToBottom]);

  // ── Handle orb tap ───────────────────────────────────────
  const handleOrbPress = useCallback(async () => {
    if (orbState === 'listening') {
      // Stop recording
      await stopRecording();
      return;
    }

    if (orbState !== 'idle') return; // Don't interrupt processing/speaking

    // Check server first
    const online = await checkServer();
    if (!online) return;

    await startRecording();
  }, [orbState, checkServer]);

  // ── Start recording ──────────────────────────────────────
  const startRecording = async () => {
    try {
      // Dynamic import for expo-av (not available on web easily)
      const { Audio } = require('expo-av');

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed for Sage to hear you.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: 3, // THREE_GPP
          audioEncoder: 1, // AMR_NB replaced by default
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: 127, // MAX
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      } as any);

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setOrbState('listening');
      setStatusText('Listening... Tap again to stop');
    } catch (error: any) {
      console.error('Recording error:', error);
      setStatusText('Failed to start recording');
      setOrbState('idle');
    }
  };

  // ── Stop recording & process ─────────────────────────────
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setOrbState('processing');
      setStatusText('Processing your voice...');

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) {
        setStatusText('No audio captured. Try again.');
        setOrbState('idle');
        return;
      }

      // ── 1. Transcribe ────────────────────────────────────
      setStatusText('Transcribing...');
      let transcription: string;
      try {
        transcription = await VoiceAgent.transcribeAudio(uri);
      } catch (e: any) {
        setStatusText(`Error: ${e.message ? e.message.substring(0, 40) : 'Transcription failed'}`);
        setOrbState('idle');
        return;
      }

      if (!transcription.trim()) {
        setStatusText("Couldn't hear you clearly. Try again.");
        setOrbState('idle');
        return;
      }

      addMessage(transcription, 'user');

      // ── 2. Detect emotion ────────────────────────────────
      setStatusText('Sensing your emotion...');
      let emotion = 'neutral';
      let emotionColor = '#A8B8C8';
      
      try {
        emotion = await VoiceAgent.detectEmotion(transcription);
        const colorMap: Record<string, string> = {
          joy: '#F0C070', sadness: '#89ABD4', anger: '#D4896A',
          fear: '#C4A4C0', disgust: '#A8B8B0', surprise: '#F0B87C', neutral: '#A8B8C8'
        };
        emotionColor = colorMap[emotion] || colorMap.neutral;
      } catch {
        // Fallback to local NLP service
        try {
          const analysis = await nlpService.analyzeText(transcription);
          emotion = analysis.dominantEmotion;
          emotionColor = analysis.dominantColor;
        } catch {
          // Absolute fallback
        }
      }

      // ── 3. Save to Journal DB ────────────────────────────
      try {
        await journalDB.insertEntry(null, {
          content: transcription,
          wordCount: transcription.trim().split(/\s+/).length,
          detectedEmotions: [{ emotion, score: 1.0, color: emotionColor }],
          dominantEmotion: { emotion, score: 1.0, color: emotionColor },
          tags: ['Voice Journal'],
          moodScore: 6,
          promptUsed: 'Talked to Sage',
        });
      } catch (e) {
        console.warn('Failed to save voice journal to DB', e);
      }

      // ── 4. Generate response (with history) ───────────────
      setStatusText('Sage is thinking...');
      setIsThinking(true);
      scrollToBottom();

      let aiResponse: string;
      try {
        const history = getConversationHistory();
        aiResponse = await VoiceAgent.generateResponse(transcription, emotion, history);
      } catch (e: any) {
        aiResponse = "I hear you. I'm having trouble finding the right words right now, but I'm here.";
      }
      setIsThinking(false);

      addMessage(aiResponse, 'sage', emotion);

      // ── 5. Speak response ────────────────────────────────
      setOrbState('speaking');
      setStatusText('Sage is speaking...');
      try {
        const audioUri = await VoiceAgent.speakText(aiResponse);
        
        // Play the audio
        if (Platform.OS !== 'web') {
          const { Audio } = require('expo-av');
          const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
          await sound.playAsync();
          // Wait for playback to finish
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              sound.unloadAsync();
              setOrbState('idle');
              setStatusText('Tap the orb to speak');
            }
          });
          return; // Don't set idle yet, wait for playback
        } else {
          // Native Web Audio playback
          const audio = new window.Audio(audioUri);
          
          audio.onended = () => {
            setOrbState('idle');
            setStatusText('Tap the orb to speak');
            // Clean up the blob URL to prevent memory leaks
            URL.revokeObjectURL(audioUri);
          };
          
          audio.onerror = () => {
            setOrbState('idle');
            setStatusText('Tap the orb to speak');
          };
          
          await audio.play();
          return; // Wait for playback to finish via the onended callback
        }
      } catch {
        // TTS failed, but we still showed the text response
      }

      setOrbState('idle');
      setStatusText('Tap the orb to speak');
    } catch (error: any) {
      console.error('Processing error:', error);
      setStatusText('Something went wrong. Try again.');
      setOrbState('idle');
      setIsThinking(false);
    }
  };

  // ── Theme colors ─────────────────────────────────────────
  const bg = theme.background;
  const textMain = theme.textMain;
  const textMuted = theme.textMuted;
  const primary = theme.primary;
  const cardBg = theme.card;
  const isDark = theme.isDark;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>  
      {/* Header */}
      <View style={[styles.header, isNarrow && styles.headerNarrow]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialIcons name="close" size={24} color={textMain} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textMain }]}>Sage</Text>
          <View style={styles.headerSubRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: serverOnline ? '#22C55E' : serverOnline === false ? '#EF4444' : '#F59E0B' },
              ]}
            />
            <Text style={[styles.headerSubtitle, { color: textMuted }]}>
              {serverOnline ? 'Voice companion' : serverOnline === false ? 'Offline' : 'Connecting...'}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Transcript area */}
      <ScrollView
        ref={scrollRef}
        style={styles.transcriptArea}
        contentContainerStyle={[styles.transcriptContent, isNarrow && styles.transcriptContentNarrow]}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="record-voice-over" size={isNarrow ? 36 : 48} color={textMuted + '40'} />
            <Text style={[styles.emptyTitle, { color: textMuted }, isNarrow && { fontSize: 18 }]}>Talk to Sage</Text>
            <Text style={[styles.emptySubtitle, { color: textMuted + '99' }, isNarrow && { fontSize: 13, paddingHorizontal: 16 }]}>
              Your AI emotional support companion.{'\n'}Tap the orb below to start a conversation.
            </Text>
          </View>
        )}
        {messages.map(msg => (
          <TranscriptBubble key={msg.id} text={msg.text} sender={msg.sender} emotion={msg.emotion} theme={theme} />
        ))}

        {/* Typing indicator */}
        {isThinking && (
          <View style={styles.thinkingWrapper}>
            <View style={[styles.thinkingBubble, { backgroundColor: isDark ? '#FFFFFF0D' : '#F0F4F8', borderColor: isDark ? '#FFFFFF15' : '#E2E8F0' }]}>
              <Text style={[styles.thinkingText, { color: textMuted }]}>Sage is thinking</Text>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, { backgroundColor: primary, opacity: 0.4 }]} />
                <View style={[styles.dot, { backgroundColor: primary, opacity: 0.6 }]} />
                <View style={[styles.dot, { backgroundColor: primary, opacity: 0.9 }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Orb & controls */}
      <View style={[styles.controlArea, { backgroundColor: isDark ? cardBg : '#F8FAFC' }, isShort && styles.controlAreaCompact]}>
        <Text style={[styles.statusText, { color: textMuted }]}>{statusText}</Text>
        <TouchableOpacity
          onPress={handleOrbPress}
          activeOpacity={0.85}
          disabled={orbState === 'processing'}
          style={styles.orbTouchable}
        >
          <VoiceOrb state={orbState} primaryColor={primary} />
        </TouchableOpacity>
        {!isShort && (
          <Text style={[styles.hintText, { color: textMuted + '80' }]}>
            {orbState === 'idle' ? 'Sage listens, understands, and responds' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 52,
    paddingBottom: 12,
  },
  headerNarrow: {
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'web' ? 10 : 44,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  transcriptArea: {
    flex: 1,
  },
  transcriptContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
  },
  transcriptContentNarrow: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  controlArea: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'web' ? 32 : 48,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  controlAreaCompact: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 16 : 24,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  orbTouchable: {
    padding: 8,
  },
  hintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  // Typing indicator styles
  thinkingWrapper: {
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 8,
  },
  thinkingText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
