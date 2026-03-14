
try:
    import whisper
    print("Whisper imported")
    import sounddevice as sd
    print("Sounddevice imported")
    import soundfile as sf
    print("Soundfile imported")
except Exception as e:
    print(f"Import failed: {e}")
