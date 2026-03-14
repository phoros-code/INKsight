# 🎙️ Voice AI Agent: Comprehensive Explanation

The **Voice AI Agent** is an end-to-end emotional support companion that can hear you, understand how you feel, think of a supportive response, and speak back to you in real-time.

---

## 🌟 The User Perspective
Imagine talking to a digital friend. You don't need to press any buttons; you just start speaking. The agent listens until you stop, analyzes not just *what* you said but *how* you felt (Happy, Sad, Angry, etc.), and then replies with a comforting voice.

### How to use it:
1. **Run the Agent**: You launch `run.bat`.
2. **Speak**: The "VAD" (Voice Activity Detection) system automatically detects when you start talking.
3. **Listen**: After a brief moment of processing, the AI speaks its response through your speakers.

---

## 🛠️ Technical Details (The "Four Pillars")

The system is built on four distinct AI stages, often referred to as a "Pipeline":

### 1. Hearing (Speech-to-Text)
- **Model**: `OpenAI Whisper (tiny)`
- **Function**: It takes the raw audio from your microphone and converts it into written text. The "tiny" version is used for maximum speed on consumer hardware.

### 2. Feeling (Emotion Detection)
- **Model**: `distilroberta-base` (fine-tuned for emotions)
- **Function**: It analyzes the transcribed text to categorize your mood into one of seven emotions (e.g., Joy, Sadness, Anger, Fear, Surprise, Disgust, or Neutral).

### 3. Thinking (Response Generation)
- **Model**: `Phi-3` (via Ollama)
- **Function**: A Large Language Model (LLM) acting as an "Empathetic Companion." It receives the text and the detected emotion as context to generate an appropriate, supportive reply.

### 4. Speaking (Text-to-Speech)
- **Model**: `Tacotron2` (LJSpeech)
- **Function**: It converts the generated text into a natural-sounding voice file (`.wav`) and plays it back immediately.

---

## 📂 Project Structure & Files

- `live_agent.py`: The "Brain" that manages the real-time loop.
- `services/`: Contains the specialized code for each of the four pillars.
- `audio/`: A folder where the agent saves temporary recordings and the AI's spoken replies.
- `requirements.txt`: The list of all "ingredients" (libraries) needed to make the code run.
- `venv_new/`: A private environment where all the heavy AI tools are installed.

---

## 🚀 Use Cases

1. **Emotional Support**: A non-judgmental companion to talk to when you're feeling down or stressed.
2. **Interactive AI**: A base for building smart home assistants or voice-controlled NPCs in games.
3. **Accessibility**: A tool for those who prefer voice interaction over typing.
4. **Offline AI**: Because it uses local models (Ollama & Whisper), it respects your privacy and can potentially run without a constant internet connection.

---

## ⚠️ Important Requirements

- **Microphone**: To be heard.
- **Speakers**: To hear the AI.
- **Ollama**: You must have [Ollama](https://ollama.com/) installed and running the `phi3` model for the "Thinking" part to work.
- **Python 3.10+**: The language that holds everything together.
