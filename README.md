<div align="center">
  <img src="assets/icon.png" width="120" height="120" alt="INKsight Icon" />
  <h1>INKsight</h1>
  <p><strong>Your AI-Powered Emotional Support Companion & Journal</strong></p>

  [![Expo](https://img.shields.io/badge/Expo-55.0.0-000020.svg?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React_Native-0.74.0-61DAFB.svg?style=flat&logo=react)](https://reactnative.dev/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
</div>

<br/>

**INKsight** is a beautifully designed, secure, and offline-first mobile and web application. It combines deep reflective journaling with "Sage," an advanced AI voice companion that listens, understands emotions, and physically responds to help support your mental well-being.

## ✨ Key Features

- **🗣️ Sage AI Voice Agent**: A fully interactive voice companion. Speak your thoughts, and Sage will transcribe, detect your emotional state, and reply with comforting voice synthesis.
- **📔 Rich Journaling**: Write daily entries with context tagging, mood tracking, and intelligent word mirror suggestions.
- **📊 Emotion Analytics**: Visualize your mental health trends over time with dynamic, customized charts utilizing local SQLite storage.
- **🔒 Privacy First**: All journal entries are stored completely locally on your device (`expo-sqlite`). A secure PIN lock protects your most personal thoughts.
- **🌐 Cross-Platform**: Built fluidly for iOS, Android, and the Web using Expo Router.

---

## 🏗️ Architecture & Tech Stack

INKsight is broken down into two primary layers: a rich React Native edge client, and an optional Python microservice backend for advanced AI capabilities.

### 📱 Frontend (React Native / Expo)
- **Framework**: [Expo](https://expo.dev/) & [React Native](https://reactnative.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: Context-based Theme System mapping to a custom design language (Colors: Sage, Accent Blue, Deep Slate)
- **Animations**: `react-native-reanimated` & `lottie-react-native` (Smooth micro-interactions and Voice Orb animations)
- **Storage**: `expo-sqlite` (Local database), `react-native-mmkv` / `AsyncStorage` (Fast key-value pairs)
- **Hardware/Audio**: `expo-av` & `expo-haptics`

### 🧠 Backend Microservice (`voice-agent-server/`)
The Voice Agent operates on a modular Python FastAPI server, orchestrating a 4-pillar AI pipeline:
1. **API Layer**: `FastAPI` + `Uvicorn`
2. **Speech-to-Text (STT)**: `openai-whisper`
3. **Emotion Detection (NLP)**: HuggingFace `transformers` (`distilroberta-finetuned-emotion`)
4. **Large Language Model (LLM)**: `google-generativeai` (Gemini Flash)
5. **Text-to-Speech (TTS)**: `edge-tts` (Lightweight, robust neural voice generation)

---

## 📂 Project Skeleton

```text
INKsight/
├── app/                        # Expo Router pages & navigation flows
│   ├── (tabs)/                 # Main Bottom Tab navigation (Home, Journal, Insights, Settings)
│   ├── modals/                 # Stack modals (Voice Agent, Quick Actions, PIN lock)
│   ├── _layout.tsx             # Root topology and Theme Providers
│   └── +not-found.tsx          # 404 Fallback
├── src/                        # Core Application Logic
│   ├── components/             # Reusable UI components (VoiceOrb, ChatBubbles, Cards)
│   ├── constants/              # Theming (Colors.ts, ThemeContext.tsx)
│   ├── database/               # Local persistence (journalDB.ts, webDataStore.ts)
│   └── services/               # API clients (voiceAgentService.ts, nlpService.ts)
├── voice-agent-server/         # Python FastAPI Backend for Sage AI
│   ├── services/                 
│   │   ├── speech_to_text.py     
│   │   ├── emotion_detector.py   
│   │   ├── response_generator.py 
│   │   └── text_to_speech.py     
│   ├── main.py                 # FastAPI routing
│   └── run.bat                 # Windows startup script
├── assets/                     # Fonts, images, splash screens
├── .github/workflows/          # GitHub Actions (CI/CD deployments for Web)
└── app.json                    # Expo configuration
```

---

## 🚀 Getting Started

### 1. Running the Web / Mobile Client
Ensure you have `Node.js` installed.
```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start

# To run specifically for the web:
npx expo start --web
```

### 2. Running the AI Voice Server
The Python server is required for the "Talk to Sage" feature to work. It must be run locally while developing.

```bash
cd voice-agent-server

# On Windows, simply run the batch script (sets up venv and installs deps automatically)
.\run.bat

# Manual Setup (Mac/Linux/Windows)
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```
> **Note:** The server expects an `.env` file containing your `GEMINI_API_KEY`. See `.env.example`.

---

## 🌍 GitHub Pages Deployment
INKsight is configured for automatic CI/CD deployment to GitHub Pages via Expo Web Export.
1. Any push to `main` triggers the `.github/workflows/deploy-web.yml` action.
2. The site is hosted statically. The Python backend **must still be hosted separately** or run locally due to its hardware requirements (memory and GPU optional for heavy ML models).

---

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
