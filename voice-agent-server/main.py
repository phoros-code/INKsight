"""
Voice Agent API Server for INKsight
FastAPI backend wrapping the voice agent pipeline:
  STT (Whisper) → Emotion Detection (distilroberta) → Response (Gemini) → TTS (Coqui)
"""

import os
import uuid
import shutil
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ── Lazy service loading ──────────────────────────────────────
# Services load ML models at import time. We import them at startup.
speech_to_text = None
emotion_detector = None
response_generator = None
text_to_speech = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup."""
    global speech_to_text, emotion_detector, response_generator, text_to_speech
    print("🚀 Loading voice agent services...")
    from services import speech_to_text as stt_mod
    from services import emotion_detector as emo_mod
    from services import response_generator as rg_mod
    from services import text_to_speech as tts_mod
    speech_to_text = stt_mod
    emotion_detector = emo_mod
    response_generator = rg_mod
    text_to_speech = tts_mod
    os.makedirs("audio", exist_ok=True)
    print("✅ All services loaded.")
    yield
    print("👋 Shutting down voice agent server.")

app = FastAPI(
    title="INKsight Voice Agent API",
    description="Backend for the Sage voice companion",
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response models ─────────────────────────────────
class TextInput(BaseModel):
    text: str

class EmotionInput(BaseModel):
    text: str

class ResponseInput(BaseModel):
    text: str
    emotion: str

class TranscriptionResult(BaseModel):
    text: str

class EmotionResult(BaseModel):
    emotion: str

class ResponseResult(BaseModel):
    response: str

class HealthResult(BaseModel):
    status: str
    services: dict

# ── Endpoints ─────────────────────────────────────────────────

@app.get("/health", response_model=HealthResult)
async def health_check():
    """Health check endpoint."""
    return HealthResult(
        status="ok",
        services={
            "speech_to_text": speech_to_text is not None,
            "emotion_detector": emotion_detector is not None,
            "response_generator": response_generator is not None,
            "text_to_speech": text_to_speech is not None,
        }
    )


@app.post("/transcribe", response_model=TranscriptionResult)
async def transcribe(file: UploadFile = File(...)):
    """Transcribe an audio file to text."""
    if speech_to_text is None:
        raise HTTPException(status_code=503, detail="Speech-to-text service not available")
    
    # Save uploaded file temporarily
    temp_path = f"audio/upload_{uuid.uuid4().hex}.wav"
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        text = speech_to_text.transcribe_audio(temp_path)
        return TranscriptionResult(text=text.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/detect-emotion", response_model=EmotionResult)
async def detect_emotion(input: EmotionInput):
    """Detect emotion from text."""
    if emotion_detector is None:
        raise HTTPException(status_code=503, detail="Emotion detection service not available")
    
    emotion = emotion_detector.detect_emotion(input.text)
    return EmotionResult(emotion=emotion)


@app.post("/generate-response", response_model=ResponseResult)
async def generate_response_endpoint(input: ResponseInput):
    """Generate an empathetic response."""
    if response_generator is None:
        raise HTTPException(status_code=503, detail="Response generator service not available")
    
    response = response_generator.generate_response(input.text, input.emotion)
    return ResponseResult(response=response)


@app.post("/speak")
async def speak(input: TextInput):
    """Generate speech from text and return WAV file."""
    if text_to_speech is None:
        raise HTTPException(status_code=503, detail="Text-to-speech service not available")
    
    output_file = f"audio/reply_{uuid.uuid4().hex}.wav"
    result = text_to_speech.speak_to_file(input.text, output_file)
    
    if result is None:
        raise HTTPException(status_code=500, detail="TTS generation failed")
    
    return FileResponse(
        result,
        media_type="audio/wav",
        filename="reply.wav",
        background=None  # Don't delete file until response is sent
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
