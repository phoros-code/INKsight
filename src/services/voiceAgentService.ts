/**
 * Voice Agent HTTP Client
 * Communicates with the Python FastAPI backend for the Sage voice companion.
 */

import { Platform } from 'react-native';

// ── Base URL configuration ──────────────────────────────────
// Android emulator uses 10.0.2.2 to reach host localhost
// iOS simulator & web use localhost directly
const getBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();
const TIMEOUT_MS = 30000; // 30s for ML model inference

// ── Helpers ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }
  return response.json();
}

// ── API Types ───────────────────────────────────────────────

export interface HealthStatus {
  status: string;
  services: {
    speech_to_text: boolean;
    emotion_detector: boolean;
    response_generator: boolean;
    text_to_speech: boolean;
  };
}

export interface TranscriptionResult {
  text: string;
}

export interface EmotionResult {
  emotion: string;
}

export interface ResponseResult {
  response: string;
}

// ── API Methods ─────────────────────────────────────────────

/**
 * Check if the voice agent backend is running and healthy.
 */
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/health`, {}, 5000);
    return handleResponse<HealthStatus>(response);
  } catch (error) {
    throw new Error(`Voice agent server unreachable at ${BASE_URL}. Is it running?`);
  }
}

/**
 * Send an audio file to the backend for transcription.
 * @param audioUri - Local URI of the audio file (from expo-av recording)
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData();
  
  // React Native needs this specific format for file uploads
  const fileObj: any = {
    uri: audioUri,
    type: 'audio/wav',
    name: 'recording.wav',
  };
  formData.append('file', fileObj);

  const response = await fetchWithTimeout(`${BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type - let fetch set it with boundary for multipart
  });

  const result = await handleResponse<TranscriptionResult>(response);
  return result.text;
}

/**
 * Detect emotion from text.
 */
export async function detectEmotion(text: string): Promise<string> {
  const response = await fetchWithTimeout(`${BASE_URL}/detect-emotion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const result = await handleResponse<EmotionResult>(response);
  return result.emotion;
}

/**
 * Generate an empathetic AI response given text and detected emotion.
 */
export async function generateResponse(text: string, emotion: string): Promise<string> {
  const response = await fetchWithTimeout(`${BASE_URL}/generate-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, emotion }),
  });

  const result = await handleResponse<ResponseResult>(response);
  return result.response;
}

/**
 * Generate speech audio from text. Returns the audio data as a blob URL.
 * On native, downloads and returns a local file URI.
 */
export async function speakText(text: string): Promise<string> {
  const response = await fetchWithTimeout(`${BASE_URL}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }, 60000); // TTS can take longer

  if (!response.ok) {
    throw new Error(`TTS failed: ${response.status}`);
  }

  // For web, create a blob URL
  if (Platform.OS === 'web') {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // For native, we need to handle differently via expo-file-system
  // For now, return a data URI approach
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
