import os
import sounddevice as sd
import soundfile as sf
try:
    from TTS.api import TTS
    # Load TTS model once at module level
    tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC")
    print("✅ TTS model loaded.")
except ImportError:
    print("❌ TTS package not installed. Speech output will be disabled.")
    tts = None
except Exception as e:
    print(f"❌ Failed to load TTS model: {e}")
    tts = None


def speak(text: str, output_file: str = "audio/reply.wav") -> None:
    """Generate speech from text and play it automatically."""

    if tts is None:
        print("❌ TTS model not available. Skipping speech.")
        return

    if not text or not text.strip():
        print("⚠️  Empty text passed to speak(). Skipping.")
        return

    try:
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else ".", exist_ok=True)

        print("🔊 Generating voice reply...")
        tts.tts_to_file(text=text, file_path=output_file)

        # Read the generated WAV and play it via sounddevice
        data, samplerate = sf.read(output_file, dtype="float32")
        print("🔊 Playing voice reply...")
        sd.play(data, samplerate)
        sd.wait()  # Block until playback finishes
        print("✅ Playback complete.")

    except Exception as e:
        print(f"❌ Error in speak(): {e}")