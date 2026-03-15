import whisper
import subprocess
import os
import wave

model = whisper.load_model("tiny")

def is_valid_wav_file(file_path):
    """Check if the WAV file is valid and not corrupted"""
    if not os.path.exists(file_path):
        return False
    
    if os.path.getsize(file_path) == 0:
        return False
    
    try:
        with wave.open(file_path, 'rb') as wav_file:
            if wav_file.getnframes() == 0:
                return False
            if wav_file.getsampwidth() == 0:
                return False
        return True
    except (wave.Error, EOFError, OSError):
        return False

def convert_audio_with_ffmpeg(input_path, output_path):
    """Convert audio file to 16kHz mono WAV format using ffmpeg"""
    command = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000", "-ac", "1",
        output_path
    ]
    
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError as e:
        print("FFmpeg error:", e)
        return False

def transcribe_audio(file_path):
    """Transcribe audio file to text using Whisper."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")
    
    if os.path.getsize(file_path) == 0:
        raise ValueError(f"Audio file is empty: {file_path}")
    
    is_valid_wav = is_valid_wav_file(file_path)
    
    base, _ = os.path.splitext(file_path)
    converted_path = f"{base}_converted.wav"
    
    if not is_valid_wav:
        print(f"Warning: Audio file may be corrupted or invalid format. Attempting conversion...")
        if not convert_audio_with_ffmpeg(file_path, converted_path):
            raise RuntimeError(f"Failed to convert audio file: {file_path}")
        transcription_file = converted_path
    else:
        transcription_file = file_path
    
    try:
        result = model.transcribe(transcription_file, fp16=False)
        return result["text"]
    except Exception as e:
        raise RuntimeError(f"Failed to transcribe audio: {e}")
    finally:
        if os.path.exists(converted_path):
            try:
                os.remove(converted_path)
            except Exception:
                pass
