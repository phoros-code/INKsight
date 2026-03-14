from transformers import pipeline

# Load emotion model once at module level
try:
    emotion_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base"
    )
    print("✅ Emotion model loaded.")
except Exception as e:
    print(f"❌ Failed to load emotion model: {e}")
    emotion_classifier = None


def detect_emotion(text: str) -> str:
    """Detect emotion from text. Returns 'neutral' on any error."""

    if emotion_classifier is None:
        return "neutral"

    if not text or not text.strip():
        return "neutral"

    try:
        result = emotion_classifier(text)
        return result[0]["label"]
    except Exception as e:
        print(f"⚠️  Emotion detection failed: {e}")
        return "neutral"
