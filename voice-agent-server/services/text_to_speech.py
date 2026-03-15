import os
import subprocess

def speak_to_file(text: str, output_file: str = "audio/reply.wav") -> str | None:
    """Generate speech from text and save to a WAV file using edge-tts. Returns the file path or None on error."""

    if not text or not text.strip():
        print("⚠️  Empty text passed to speak(). Skipping.")
        return None

    try:
        os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else ".", exist_ok=True)

        print("🔈 Generating voice reply with edge-tts...")
        # using a pleasant female voice
        voice = "en-US-AriaNeural"
        
        # Run edge-tts via subprocess (easy sync wrapping)
        result = subprocess.run(
            ["edge-tts", "--voice", voice, "--text", text, "--write-media", output_file],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Voice reply generated.")
            return output_file
        else:
            print(f"❌ Error in edge-tts: {result.stderr}")
            return None

    except FileNotFoundError:
        print("❌ edge-tts not installed or not in PATH.")
        return None
    except Exception as e:
        print(f"❌ Error in speak(): {e}")
        return None
