import os
import google.generativeai as genai

# ── Emotion-specific therapeutic strategies ──────────────────
EMOTION_STRATEGIES = {
    "sadness": (
        "The user is feeling sad. Use gentle validation: acknowledge their pain is real and okay. "
        "Normalize their feelings ('It makes complete sense to feel this way'). "
        "If appropriate, suggest a small grounding exercise (e.g., 'Take a slow breath with me'). "
        "Never rush them to feel better or minimize their experience."
    ),
    "anger": (
        "The user is feeling angry. First acknowledge the anger without dismissal ('That sounds really frustrating'). "
        "Avoid telling them to calm down. Validate that their reaction makes sense. "
        "If they seem open to it, gently offer a reframing perspective or a simple breathing pause. "
        "Help them feel heard, not lectured."
    ),
    "fear": (
        "The user is feeling anxious or afraid. Be a calming, steady presence. "
        "Reassure them that they are safe in this moment. "
        "If appropriate, guide a brief 5-4-3-2-1 grounding exercise (name 5 things you see, 4 you hear, etc.). "
        "Use short, warm sentences. Avoid overwhelming them with too many suggestions."
    ),
    "joy": (
        "The user is feeling joyful! Celebrate with them genuinely. Amplify their positive emotion. "
        "Ask what made them feel this way or encourage them to savor the moment. "
        "Use warm, enthusiastic language. Help them anchor this feeling as a resource for harder days."
    ),
    "surprise": (
        "The user is feeling surprised. Explore what surprised them with curiosity. "
        "Help them process whether it's a positive or unsettling surprise. "
        "Be genuinely interested and give them space to share more."
    ),
    "disgust": (
        "The user is feeling disgust or aversion. Validate that some things genuinely warrant that reaction. "
        "Don't dismiss their feeling. Help them process what triggered it and whether they want to talk through it."
    ),
    "neutral": (
        "The user's emotion is neutral. Gently check in with open curiosity: 'How are you really doing today?' "
        "Create space for them to explore what's beneath the surface. "
        "Use warm, open-ended questions to invite deeper sharing."
    ),
}

# ── Safety guardrail keywords ────────────────────────────────
CRISIS_KEYWORDS = [
    "kill myself", "suicide", "end my life", "want to die", "self-harm",
    "hurt myself", "no reason to live", "better off dead", "can't go on",
]

CRISIS_RESPONSE = (
    "I hear you, and I want you to know that what you're feeling matters deeply. "
    "Please reach out to someone who can help right now — "
    "you can call or text the 988 Suicide & Crisis Lifeline (call/text 988) "
    "or iCall at 9152987821. You are not alone, and there are people who care. 💙"
)


def generate_response(user_text: str, emotion: str, history: list = None) -> str:
    """
    Generate an empathetic, therapeutic response using Google Gemini.
    Uses conversation history for context and emotion-specific strategies.
    """
    if history is None:
        history = []

    # ── Safety check ─────────────────────────────────────────
    lower_text = user_text.lower()
    for keyword in CRISIS_KEYWORDS:
        if keyword in lower_text:
            return CRISIS_RESPONSE

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("❌ Error: GEMINI_API_KEY not found or not configured.")
        return _fallback_response(emotion)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')

        # Build conversation context
        history_text = ""
        if history:
            history_text = "\n--- Conversation so far ---\n"
            for msg in history[-6:]:  # last 6 messages
                role_label = "User" if msg.get("role") == "user" else "Sage"
                history_text += f"{role_label}: {msg.get('text', '')}\n"
            history_text += "--- End of conversation ---\n"

        # Get emotion-specific strategy
        strategy = EMOTION_STRATEGIES.get(emotion, EMOTION_STRATEGIES["neutral"])

        prompt = f"""You are Sage, a warm and wise AI emotional support companion inside the INKsight journaling app.

## Your Core Principles:
- You practice active listening — reflect back what the user said in your own words
- You validate emotions before offering any suggestions
- You use evidence-based techniques: CBT reframing, mindfulness, grounding exercises
- You never diagnose, prescribe, or replace professional therapy
- You are warm, genuine, and conversational — like a caring friend who's also wise
- You remember what the user said earlier in this conversation and build on it

## Emotional Context:
Detected emotion: **{emotion}**

## Strategy for this emotion:
{strategy}

{history_text}

## Current message from the user:
"{user_text}"

## Response Guidelines:
- Keep it 2-4 sentences. This will be spoken aloud, so keep it natural and conversational.
- Start by acknowledging what they said or how they feel (don't jump straight to advice).
- If they shared something, reflect it back briefly before responding.
- Use their name if they share it. Use "you" language to feel personal.
- If this is a follow-up message, reference something from earlier in the conversation.
- End with either a gentle question, a small actionable suggestion, or a warm affirmation.
- Do NOT use bullet points, numbered lists, markdown, emojis, or asterisks. Write in plain spoken sentences.
- Sound like a human, not an AI. No clinical or robotic language.

Respond now as Sage:"""

        response = model.generate_content(prompt)
        
        if response and response.text:
            return response.text.strip()
        
        return _fallback_response(emotion)

    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return _fallback_response(emotion)


def _fallback_response(emotion: str) -> str:
    """Provide a warm fallback response tailored to the detected emotion when Gemini is unavailable."""
    fallbacks = {
        "sadness": "I can hear that you're going through something heavy right now. Whatever you're feeling, it's valid, and I'm here with you.",
        "anger": "It sounds like something really got to you. That frustration you're feeling is completely understandable. Take a moment if you need to.",
        "fear": "I sense some worry in what you shared. I want you to know, right here in this moment, you're safe. Let's take a breath together.",
        "joy": "I love hearing that! That happiness in your voice is wonderful. Hold onto that feeling — you deserve every bit of it.",
        "surprise": "Oh wow, that sounds unexpected! I'm curious to hear more about what happened, whenever you're ready to share.",
        "disgust": "That sounds like it was a really unpleasant experience. Your reaction makes complete sense. Want to talk through it?",
        "neutral": "I'm here and listening. How are you really doing today? Sometimes the most important things are just beneath the surface.",
    }
    return fallbacks.get(emotion, fallbacks["neutral"])
