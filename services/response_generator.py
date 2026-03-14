import requests

def generate_response(user_text, emotion):

    prompt = f"""
You are an emotional support companion.

User emotion: {emotion}

User said: {user_text}

Respond in a supportive and empathetic way.
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3:latest",
                "prompt": prompt,
                "stream": False
            }
        )

        if response.status_code != 200:
            print(f"❌ Ollama Error: {response.status_code} - {response.text}")
            return "I'm here for you."

        data = response.json()

        if "response" in data:
            return data["response"]
        
        print(f"⚠️  Unexpected Ollama response: {data}")
        return "I'm here to listen. Tell me more about how you're feeling."

    except Exception as e:
        print("❌ LLM Connection Error:", e)
        return "I'm here for you."