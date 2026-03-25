# ADR-007: Voice and Chat Scope for MVP

> **Status:** Accepted
> **Date:** March 2026
> **Decision:** No voice, no chat in MVP. Preset quick actions only.

---

## Context

The research identifies in-drive communication as a core need (convoy members need to coordinate without typing). The obvious solution is voice chat. However, voice introduces significant technical complexity:

- **WebRTC** is required for real-time audio, which needs STUN/TURN infrastructure
- **TURN servers** relay media when peer-to-peer fails (which is common on mobile networks) — they are operationally complex and expensive to run
- **Background audio** on iOS/Android requires additional permissions and entitlements
- **Echo cancellation, noise suppression, and audio routing** (speaker, earpiece, Bluetooth) are non-trivial
- **Managed alternatives** (Agora, Twilio, LiveKit) charge per-minute fees that add up quickly

Text chat also has concerns:
- Encourages typing while driving (the opposite of Karavyn's safety-first design)
- Duplicates existing group chat tools (iMessage, WhatsApp, Discord)
- Adds moderation complexity (content filtering, spam, abuse)

## Decision

**No voice and no text chat in MVP.** Communication is handled entirely through:

1. **Quick status updates:** On My Way / Here / Running Late (per-member, visible to all)
2. **Quick pings:** Regroup / Moving / Need Help / Stopping (broadcast or personal, fire-and-forget)

These are preset, require no typing, and are safe to use while driving (single large tap).

## Rationale

- **Safety first.** Karavyn's product thesis includes reducing distracted driving. Adding typing-based chat would contradict this. Preset pings are the safest coordination primitive.
- **Scope control.** Voice is the single highest-complexity feature in the product. WebRTC + TURN + background audio + Bluetooth routing could easily consume the entire MVP timeline by itself. It must not delay the core session experience.
- **Good enough for MVP.** The preset actions cover the most critical coordination needs: "where are you?" (status), "come back together" (regroup), "I need help" (need help), "the group is moving" (moving). This handles 80% of real-world coordination messages.
- **Users already have voice.** If convoy members need to talk, they can (and already do) use a phone call, FaceTime Audio, or Discord. Karavyn doesn't need to replace voice chat — it needs to replace the "where are you?" texts.

## Phase 2 Path: Voice Notes

When voice is introduced, start with **voice notes** (recorded audio clips sent within a session):
- Simpler than live voice — no STUN/TURN, no real-time audio routing
- Works asynchronously (record → send → play)
- Safe for driving (record with one tap, listen on speaker)
- Builds toward voice rooms without the full WebRTC investment

## Phase 3 Path: Live Voice Rooms

If voice notes validate demand, implement **foreground-only voice rooms**:
- WebRTC via a managed service (LiveKit is open-source and self-hostable, or Agora/Twilio for managed)
- Push-to-talk or open mic within a session
- Foreground only — no background audio streaming
- Cost: managed services charge $1-5 per 1,000 minutes; self-hosted LiveKit reduces cost but adds ops burden

## Consequences

- **Positive:** MVP ships faster. No voice infrastructure to build, test, or pay for.
- **Positive:** Safety story is clean — Karavyn's MVP explicitly avoids encouraging interaction while driving.
- **Negative:** Car club users may ask "where's the walkie-talkie?" — must communicate that voice is coming and that the preset actions solve the immediate need.
- **Negative:** Missing voice may reduce engagement compared to a full-featured competitor. Mitigated by: no competitor currently offers the session + map + coordination combination even without voice.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **WebRTC voice rooms in MVP** | 4-8 weeks of development, STUN/TURN infrastructure, background audio complexity, Bluetooth routing, echo cancellation. Would consume the entire MVP timeline. |
| **Text chat in MVP** | Encourages typing while driving. Duplicates group chat apps. Adds moderation burden. Contradicts safety-first positioning. |
| **Third-party voice SDK (Agora, Twilio)** | Reduces development time but adds per-minute cost ($1-5/1000 min). Still requires audio routing, permissions, and background handling. Better as a Phase 3 option than MVP scope. |
| **Push-to-talk voice notes in MVP** | Feasible but still requires audio recording, upload, storage, playback, and notification infrastructure. S/M effort that is better spent on core session features. Phase 2. |
