from services.speech_to_text import transcribe_audio
from services.emotion_detector import detect_emotion
from services.response_generator import generate_response
from services.text_to_speech import speak


def run_voice_agent():

    audio_file = "audio/input.wav"

    try:
        print("Transcribing audio...")
        text = transcribe_audio(audio_file)

        print("User:", text)

        emotion = detect_emotion(text)

        print("Emotion detected:", emotion)

        response = generate_response(text, emotion)

        print("AI:", response)

        speak(response)

        print("Voice reply saved to audio/reply.wav")
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Please ensure the audio file exists at audio/input.wav")
    
    except ValueError as e:
        print(f"Error: {e}")
        print("The audio file is empty. Please provide a valid audio file.")
    
    except RuntimeError as e:
        print(f"Error: {e}")
        print("Failed to process the audio file. It may be corrupted or in an unsupported format.")
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        print("An unexpected error occurred during audio processing.")


if __name__ == "__main__":
    run_voice_agent()