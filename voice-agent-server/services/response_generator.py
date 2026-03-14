import os
import google.generativeai as genai

def generate_response(user_text: str, emotion: str) -> str:
    """
    Generate an empathetic response using Google Gemini.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment variables.")
        return "I'm here for you, but I'm having trouble connecting to my brain right now."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""
You are an emotional support companion named Sage, part of the INKsight journaling app.

User emotion: {emotion}
User said: {user_text}

Respond in a supportive, short, and empathetic way. Keep the response concise (2-3 sentences max) for voice interaction. 
Be warm but not overly enthusiastic. Match your tone to their emotion.
"""
        response = model.generate_content(prompt)
        
        if response and response.text:
            return response.text.strip()
        
        return "I hear you. Tell me more about how you're feeling."

    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return "I'm here for you. I'm listening."
