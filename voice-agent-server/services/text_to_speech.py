import os
import soundfile as sf

try:
    from TTS.api import TTS
    tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC")
    print("✅ TTS model loaded.")
except ImportError:
    print("❌ TTS package not installed. Speech output will be disabled.")
    tts = None
except Exception as e:
    print(f"❌ Failed to load TTS model: {e}")
    tts = None


def speak_to_file(text: str, output_file: str = "audio/reply.wav") -> str | None:
    """Generate speech from text and save to a WAV file. Returns the file path or None on error."""

    if tts is None:
        print("❌ TTS model not available. Skipping speech.")
        return None

    if not text or not text.strip():
        print("⚠️  Empty text passed to speak(). Skipping.")
        return None

    try:
        os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else ".", exist_ok=True)

        print("🔈 Generating voice reply...")
        tts.tts_to_file(text=text, file_path=output_file)
        print("✅ Voice reply generated.")
        return output_file

    except Exception as e:
        print(f"❌ Error in speak(): {e}")
        return None
