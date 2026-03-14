import os
import wave

def is_valid_wav_file(file_path):
    """Check if the WAV file is valid and not corrupted"""
    if not os.path.exists(file_path):
        return False
    
    if os.path.getsize(file_path) == 0:
        return False
    
    try:
        # Try to open the WAV file to check if it's valid
        with wave.open(file_path, 'rb') as wav_file:
            # Check if file has frames (audio data)
            if wav_file.getnframes() == 0:
                return False
            # Check if sample width is valid
            if wav_file.getsampwidth() == 0:
                return False
        return True
    except (wave.Error, EOFError, OSError):
        return False

# Test with the corrupted audio file
audio_file = "audio/input.wav"

print(f"File exists: {os.path.exists(audio_file)}")
print(f"File size: {os.path.getsize(audio_file)} bytes")
print(f"Is valid WAV file: {is_valid_wav_file(audio_file)}")

# Test with a non-existent file
print(f"Non-existent file validation: {is_valid_wav_file('nonexistent.wav')}")

# Test with empty file (create one temporarily)
with open('empty.wav', 'w') as f:
    pass
print(f"Empty file validation: {is_valid_wav_file('empty.wav')}")
os.remove('empty.wav')