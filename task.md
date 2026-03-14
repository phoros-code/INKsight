# Voice Agent Integration — Task Tracker

## Phase 1: Planning
- [x] Explore INKsight app structure (Expo Router, tabs, modals, services)
- [x] Read all voice-agent branch files (live_agent, services, README)
- [x] Identify integration points and UI placement
- [x] Write implementation plan
- [x] Get user approval on implementation plan

## Phase 2: Backend — Python Voice Agent API Server
- [ ] Create `voice-agent-server/` directory in project root
- [ ] Port voice agent Python services into a FastAPI server
- [ ] Create `/transcribe`, `/detect-emotion`, `/generate-response`, `/speak` endpoints
- [ ] Add health-check endpoint
- [ ] Write `requirements.txt` and startup script

## Phase 3: Frontend — React Native Voice Agent UI
- [ ] Create `src/services/voiceAgentService.ts` (HTTP client to backend)
- [ ] Create `src/components/voice/VoiceAgentScreen.tsx` (main full-screen UI)
- [ ] Create `src/components/voice/VoiceOrb.tsx` (animated listening indicator)
- [ ] Create `src/components/voice/TranscriptBubble.tsx` (chat-style transcript)
- [ ] Add FAB (Floating Action Button) to Home screen for quick access
- [ ] Add `app/modals/voice-agent.tsx` modal route
- [ ] Register modal in `app/modals/_layout.tsx`

## Phase 4: Integration & Polish
- [ ] Wire audio recording (expo-av) into the voice agent flow
- [ ] Connect to existing emotion detection in `nlpService.ts`
- [ ] Store voice journal entries in the journal DB
- [ ] Add Sage entry point to Quick Actions grid on Home
- [ ] Theme-aware styling matching INKsight's design system

## Phase 5: Verification
- [ ] Test backend server starts and responds on all endpoints
- [ ] Test frontend UI renders, records, and displays transcript
- [ ] End-to-end: speak → transcribe → emotion → response → TTS
- [ ] User manual test on mobile device
