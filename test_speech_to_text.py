# import subprocess
# import os
# import wave

# def is_valid_wav_file(file_path):
#     """Check if the WAV file is valid and not corrupted"""
#     if not os.path.exists(file_path):
#         return False
    
#     if os.path.getsize(file_path) == 0:
#         return False
    
#     try:
#         # Try to open the WAV file to check if it's valid
#         with wave.open(file_path, 'rb') as wav_file:
#             # Check if file has frames (audio data)
#             if wav_file.getnframes() == 0:
#                 return False
#             # Check if sample width is valid
#             if wav_file.getsampwidth() == 0:
#                 return False
#         return True
#     except (wave.Error, EOFError, OSError):
#         return False

# def convert_audio_with_ffmpeg(input_path, output_path):
#     """Convert audio file to 16kHz mono WAV format using ffmpeg"""
#     command = [
#         "ffmpeg", "-y", "-i", input_path,
#         "-ar", "16000", "-ac", "1",
#         output_path
#     ]
    
#     try:
#         subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
#         return True
#     except subprocess.CalledProcessError:
#         return False

# def test_audio_processing():
#     audio_file = "audio/input.wav"
    
#     print("Testing audio file processing...")
#     print(f"Audio file: {audio_file}")
    
#     # Validate file existence and basic properties
#     if not os.path.exists(audio_file):
#         print("Error: Audio file not found")
#         return
    
#     if os.path.getsize(audio_file) == 0:
#         print("Error: Audio file is empty")
#         return
    
#     # Check if file is a valid WAV file
#     is_valid_wav = is_valid_wav_file(audio_file)
#     print(f"Is valid WAV file: {is_valid_wav}")
    
#     base, _ = os.path.splitext(audio_file)
#     converted_path = f"{base}_converted.wav"
    
#     # If file is not a valid WAV, try to convert it
#     if not is_valid_wav:
#         print("Warning: Audio file may be corrupted or invalid format. Attempting conversion...")
#         if convert_audio_with_ffmpeg(audio_file, converted_path):
#             print("Conversion successful!")
#             print(f"Converted file: {converted_path}")
            
#             # Check if converted file is valid
#             if is_valid_wav_file(converted_path):
#                 print("Converted file is valid!")
#             else:
#                 print("Converted file is still invalid")
            
#             # Clean up
#             if os.path.exists(converted_path):
#                 os.remove(converted_path)
#                 print("Cleaned up converted file")
#         else:
#             print("Error: Failed to convert audio file")
#     else:
#         print("File is valid, no conversion needed")

# if __name__ == "__main__":
#     test_audio_processing()

from TTS.api import TTS
import sounddevice as sd
import soundfile as sf

# load TTS model
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC")

def speak(text):

    output_file = "audio/reply.wav"

    # generate speech
    tts.tts_to_file(
        text=text,
        file_path=output_file
    )

    # play audio automatically
    data, samplerate = sf.read(output_file)

    sd.play(data, samplerate)
    sd.wait()