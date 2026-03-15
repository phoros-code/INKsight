# INKsight - AI-Powered Emotional Support Companion

## Slide 1: Title & Team Info
*   **Team Name:** Phoros-code
*   **Team Members:** [Member Names]
*   **Selected Problem Statement:** Digital Mental Health & Accessible Emotional Support
*   **Project Title:** INKsight: Your AI-Powered Emotional Support Companion & Journal

---

## Slide 2: Problem Overview
*   **The Problem:** Traditional journaling often feels burdensome and lacks immediate validation. Mental health professional support is frequently inaccessible, expensive, or delayed.
*   **Significance:** Individuals need a private, secure, and immediate way to process emotions and receive empathetic feedback without the friction of typing or the fear of data leaks.
*   **Impact:** Bridges the gap between passive reflection and active emotional support through voice interaction.

---

## Slide 3: Analysis of Challenges
*   **Pain Points:**
    *   **Friction:** Writing long journal entries is mentally taxing during a crisis.
    *   **Privacy:** High-sensitivity emotional data is often stored on cloud servers, risking exposure.
    *   **Static Feedback:** Most journals are "black holes"—data goes in, but nothing comes out to help the user in the moment.
*   **Support:** Research supports "affect labeling" (putting feelings into words) as a key method to reduce emotional distress, especially when done verbally.

---

## Slide 4: Proposed Solution
*   **Innovative Approach: Sage AI**: An advanced AI voice companion integrated directly into the journaling workflow.
*   **Unique Selling Point (USP):**
    *   **Physiological Interaction:** Users speak their thoughts; the system transcribes, detects fine-grained emotions, and responds with a comforting neural voice.
    *   **Privacy-First:** Secure offline-first architecture with local SQLite storage and PIN protection.
    *   **Emotion Analytics:** Dynamic visualization of mood trends derived automatically from voice and text entries.

---

## Slide 5: Technical Stack
*   **Mobile / Web:** React Native, Expo, Expo Router (unified codebase).
*   **Backend:** Python FastAPI microservice for AI orchestration.
*   **AI/ML Pipeline:**
    *   **STT:** OpenAI Whisper (Speech-to-Text).
    *   **NLP:** HuggingFace `distilroberta-finetuned-emotion` (Emotion Detection).
    *   **LLM:** Google Gemini Flash (Generative empathetic response).
    *   **TTS:** Edge-TTS (Neural voice synthesis).
*   **Data:** `expo-sqlite` for local persistence.

---

## Slide 6: Implementation Strategy
*   **36-Hour Sprint Roadmap:**
    *   **0-12h:** Backend API development and integration of the 4-pillar AI pipeline.
    *   **12-24h:** React Native frontend development: Voice Orb animations, audio recording logic, and real-time transcripts.
    *   **24-36h:** Data persistence (Journal DB), PIN-lock security implementation, and cross-platform (Web/Mobile) UI polish.
*   **Architecture:** Modular microservice design allowing the high-compute AI server to scale independently of the light-weight client.

---

## Slide 7: Feasibility & Innovation
*   **Feasibility:** Utilizes optimized, lightweight transformer models (DistilRoBERTa) and efficient APIs (Gemini Flash) to ensure responsive interaction even on standard hardware.
*   **Innovation:** Transforms the solo act of journaling into a dialogue. The "Voice Orb" provides a physiological focus point for grounding, while the word-mirroring logic helps users visualize their subconscious recurring themes.

---

## Slide 8: Prototype / Demo
*   **Key Features Demonstrated:**
    *   **The Sage Orb:** Animated voice interface that "breaths" with the user.
    *   **Real-time Emotion Tagging:** Visual markers (Sadness, Joy, Fear) attached to journal entries.
    *   **Insights Dashboard:** Victory-native charts showing 90-day emotional trends.
    *   **Secure Journal:** Biometric/PIN-protected entry list.

---

## Slide 9: Future Vision
*   **Wearable Integration:** Sync with Smartwatches to detect stress (elevated heart rate) and proactively trigger a "Check-in with Sage."
*   **Hyper-Local AI:** Deployment of 4-bit quantized LLMs (like Llama-3 or Mistral) directly on-device for 100% air-gapped emotional privacy.
*   **Multilingual Empathy:** Expanding support for regional languages to make mental health support truly global and culturally nuanced.

---

## Slide 10: Conclusion & Q&A
*   **Summary:** INKsight isn't just a journal; it's a secure, empathetic, and interactive emotional companion designed for the modern age.
*   **Closing:** "Your voice matters. Let INKsight help you hear it."
*   **Thank You!**
*   **Questions?**
