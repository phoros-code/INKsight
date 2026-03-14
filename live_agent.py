import os
from dotenv import load_dotenv
load_dotenv()

import queue
import time
import numpy as np
import sounddevice as sd
import soundfile as sf

from services.speech_to_text import transcribe_audio
from services.emotion_detector import detect_emotion
from services.response_generator import generate_response
from services.text_to_speech import speak

# Audio settings
SAMPLE_RATE = 16000
CHANNELS = 1
AUDIO_DIR = "audio"
INPUT_FILE = os.path.join(AUDIO_DIR, "live_input.wav")

# VAD Settings
THRESHOLD = 0.01        # Amplitude threshold for speech
SILENCE_LIMIT = 2.0     # Seconds of silence to stop recording
CHUNK_SIZE = 1024       # Frames per buffer

def ensure_audio_dir() -> None:
    """Create the audio directory if it doesn't exist."""
    os.makedirs(AUDIO_DIR, exist_ok=True)

def record_audio_vad() -> bool:
    """
    Record audio continuously using VAD (Voice Activity Detection).
    Starts recording when speech is detected and stops after silence.
    """
    audio_queue = queue.Queue()

    def callback(indata, frames, time_info, status):
        if status:
            print(f"⚠️  Stream status: {status}")
        audio_queue.put(indata.copy())

    ensure_audio_dir()
    
    print("\n🎤 Start speaking...")
    
    recorded_frames = []
    recording_started = False
    silence_start_time = None
    
    try:
        with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, 
                            dtype='float32', callback=callback, 
                            blocksize=CHUNK_SIZE):
            
            while True:
                try:
                    # Get chunk from queue
                    chunk = audio_queue.get(timeout=0.1)
                except queue.Empty:
                    continue

                # Calculate RMS (Volume)
                rms = np.sqrt(np.mean(chunk**2))

                if not recording_started:
                    # Waiting for speech to start
                    if rms > THRESHOLD:
                        print("🎙 Recording...")
                        recording_started = True
                        recorded_frames.append(chunk)
                        silence_start_time = time.time()
                else:
                    # Currently recording
                    recorded_frames.append(chunk)

                    if rms > THRESHOLD:
                        # User is still speaking
                        silence_start_time = time.time()
                    else:
                        # Silence detected
                        if time.time() - silence_start_time > SILENCE_LIMIT:
                            print("🛑 Silence detected. Processing...")
                            break
        
        # Save recording
        if recorded_frames:
            audio_data = np.concatenate(recorded_frames, axis=0)
            sf.write(INPUT_FILE, audio_data, SAMPLE_RATE)
            return True
        return False

    except Exception as e:
        print(f"❌ Microphone error: {e}")
        return False

def run_live_agent() -> None:
    """Main loop: VAD record → transcribe → detect emotion → LLM → speak."""

    ensure_audio_dir()
    print("\n🤖 Voice AI Agent (VAD Mode) started. Press Ctrl+C to quit.\n")

    while True:
        try:
            # ── 1. Record with VAD ──────────────────────────────────────
            if not record_audio_vad():
                print("⚠️  Failed to capture audio. retrying...\n")
                time.sleep(1)
                continue

            # ── 2. Transcribe ─────────────────────────────────────────────
            try:
                text = transcribe_audio(INPUT_FILE)
                text_clean = text.strip()
                if not text_clean:
                    print("⚠️  No speech detected in recording. Listening again...\n")
                    continue
                print(f"📝 You said: {text_clean}")
            except Exception as e:
                print(f"❌ Transcription failed: {e}. Skipping.\n")
                continue

            # ── 3. Detect emotion ─────────────────────────────────────────
            emotion = detect_emotion(text_clean)
            print(f"🧠 Emotion detected: {emotion}")

            # ── 4. Generate response ──────────────────────────────────────
            try:
                response = generate_response(text_clean, emotion)
                print(f"💬 AI: {response.strip()}")
            except Exception as e:
                print(f"❌ Response generation failed: {e}. Skipping.\n")
                continue

            # ── 5. Speak ──────────────────────────────────────────────────
            speak(response)
            print("─" * 50)

        except KeyboardInterrupt:
            print("\n\n👋 Voice agent stopped. Goodbye!")
            break
        except Exception as e:
            print(f"❌ Unexpected error in main loop: {e}. Restarting loop...\n")
            time.sleep(1)
            continue

if __name__ == "__main__":
    run_live_agent()