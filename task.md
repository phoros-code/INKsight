# Voice Agent Integration — Task Tracker

## Phase 1: Planning
- [x] Explore INKsight app structure (Expo Router, tabs, modals, services)
- [x] Read all voice-agent branch files (live_agent, services, README)
- [x] Identify integration points and UI placement
- [x] Write implementation plan
- [x] Get user approval on implementation plan

## Phase 2: Backend — Python Voice Agent API Server
- [x] Create `voice-agent-server/` directory in project root
- [x] Port voice agent Python services into a FastAPI server
- [x] Create `/transcribe`, `/detect-emotion`, `/generate-response`, `/speak` endpoints
- [x] Add health-check endpoint
- [x] Write `requirements.txt` and startup script

## Phase 3: Frontend — React Native Voice Agent UI
- [x] Create `src/services/voiceAgentService.ts` (HTTP client to backend)
- [x] Create `src/components/voice/VoiceAgentScreen.tsx` (main full-screen UI)
- [x] Create `src/components/voice/VoiceOrb.tsx` (animated listening indicator)
- [x] Create `src/components/voice/TranscriptBubble.tsx` (chat-style transcript)
- [x] Add `app/modals/voice-agent.tsx` modal route
- [x] Register modal in `app/modals/_layout.tsx`

## Phase 4: Integration & Polish
- [x] Wire audio recording (expo-av) into the voice agent flow
- [x] Add Sage entry point to Quick Actions grid on Home
- [x] Theme-aware styling matching INKsight's design system
- [x] Connect to existing emotion detection in `nlpService.ts`
- [x] Store voice journal entries in the journal DB

## Phase 5: Verification
- [x] Web export builds successfully (no errors, deployment safe)
- [ ] Test backend server starts and responds on all endpoints
- [ ] Test frontend UI renders, records, and displays transcript
- [ ] End-to-end: speak → transcribe → emotion → response → TTS
- [ ] User manual test on mobile device
