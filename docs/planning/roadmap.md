# Karavyn — Roadmap

> **Version:** 1.0
> **Last updated:** March 2026
> **Context:** Solo founder, full-time equivalent effort

---

## MVP Milestone Plan (Weeks 1-12)

The MVP delivers the core session loop: create a session, invite people, see each other on a live map, coordinate with roles and quick actions, and end the session cleanly.

### Milestone 1: Foundation (Weeks 1-2)

**Goal:** Working monorepo with auth end-to-end. A user can sign in on mobile and hit an authenticated API endpoint.

| Task | Days | Output |
|---|---|---|
| Initialize Turborepo monorepo (Expo + Fastify + shared package) | 1 | Repo structure, build pipeline, shared tsconfig |
| Set up Neon Postgres + Drizzle ORM, create `users` table | 1 | DB connected, schema migration working |
| Integrate Clerk on mobile (sign up, sign in, sign out) | 2 | Auth flow working on iOS/Android |
| Integrate Clerk JWT verification on Fastify (middleware) | 1 | API rejects unauthenticated requests |
| Clerk webhook → sync user to Postgres | 1 | User record created on first sign-up |
| Basic user profile screen (name, avatar) | 1 | Profile viewable and editable |
| CI setup (lint, typecheck, build) | 0.5 | GitHub Actions or similar |
| Environment config (dev, staging, prod) | 0.5 | .env files, typed config loader |

**Demo checkpoint:** Open the app → sign in with Google → see your profile → API returns your user data.

### Milestone 2: Session Core (Weeks 3-4)

**Goal:** A user can create and join sessions. Sessions have state, members, and invite links.

| Task | Days | Output |
|---|---|---|
| Create `sessions`, `session_members` schema + migrations | 1 | Tables created |
| Session CRUD API (create, get, list, end) | 2 | REST endpoints working |
| Invite code generation + `GET /join/:inviteCode` lookup | 1 | 6-char codes, unique, collision-resistant |
| Join session API (POST /sessions/join) | 1 | Creates membership record |
| Session list screen (active sessions for current user) | 1 | Home screen shows sessions |
| Session detail screen (name, mode, member list, status) | 2 | Basic session view |
| Deep link handling (Expo Router + universal links) | 2 | Tap invite link → open app → land in session |

**Demo checkpoint:** Create a session → get an invite link → open link on another device → second user joins → both see each other in the member list.

### Milestone 3: Real-Time Foundation (Weeks 5-6)

**Goal:** Socket.io gateway running. Users in a session see live presence. Members appear and disappear in real time.

| Task | Days | Output |
|---|---|---|
| Socket.io server setup (attach to Fastify) | 1 | WebSocket gateway running |
| Socket.io auth middleware (verify Clerk JWT on handshake) | 1 | Only authenticated users can connect |
| Session room management (join room, leave room) | 1 | Clients join rooms by session ID |
| In-memory SessionState management | 2 | Server-side state objects for active sessions |
| Presence heartbeat system (client sends, server tracks) | 2 | Active / idle / disconnected states |
| Real-time member join/leave events | 1 | Other members see join/leave instantly |
| Basic reconnection handling (rejoin room, resync state) | 2 | Survives network transitions |

**Demo checkpoint:** Two devices in a session → one goes offline → other sees "disconnected" → first comes back → presence restores.

### Milestone 4: Location and Map (Weeks 7-8)

**Goal:** The core product experience — a live map showing all session members in real time.

| Task | Days | Output |
|---|---|---|
| Expo Location setup (foreground permission flow) | 1 | Location permission granted and tracked |
| Location streaming (client → Socket.io → server → broadcast) | 2 | Real-time location pipeline working |
| Mode-based update rates (Drive: 3-5s, Walk: 10-15s, Hang: 30s) | 1 | Update rate adapts to mode |
| Google Maps integration (react-native-maps) | 1 | Map renders on session screen |
| Member markers on map (avatar, name, status) | 2 | Members visible as markers |
| "Center on group" button (fit all members in view) | 0.5 | Quick re-center action |
| Location buffer + batch Postgres writes | 1 | Location history persisted efficiently |
| Background location (Drive mode — foreground service/significant change) | 2 | Location works when app backgrounded |

**Demo checkpoint:** Two devices in Drive mode → both moving → see each other's markers update in real time on the map.

### Milestone 5: Coordination Features (Weeks 9-10)

**Goal:** Full coordination toolkit — roles, destinations, status, pings.

| Task | Days | Output |
|---|---|---|
| `destinations` schema + API (set, change, clear) | 1 | Destination CRUD |
| Destination pin on map (visible to all, tap to navigate) | 1.5 | Pin appears, opens Maps on tap |
| Role management (promote to mod, demote) | 1 | Host can manage roles |
| Permission enforcement (server-side checks) | 1 | Unauthorized actions rejected |
| Status updates (On My Way / Here / Running Late) | 1 | Status selector, visible on markers |
| Quick pings (Regroup / Moving / Need Help / Stopping) | 1.5 | Ping button bar, broadcast to session |
| Session mode selector (Drive / Walk / Hang) | 1 | Mode changes affect update rate + UI |
| Kick member (host/mod action) | 0.5 | Remove member from session |
| `session_events` logging for all actions | 1 | Events recorded to Postgres |

**Demo checkpoint:** Host pins a destination → all members see it → member taps to navigate → member sets status "On My Way" → host sends "Regroup" ping → everyone gets it.

### Milestone 6: Polish and Ship (Weeks 11-12)

**Goal:** Production-ready MVP. Internal testing, bug fixes, UX polish.

| Task | Days | Output |
|---|---|---|
| Push notifications (session start, destination change, regroup, arrive) | 2 | Expo Push Notifications wired |
| QR code generation for invite links | 0.5 | Shareable QR code |
| Session history screen (past sessions list) | 1.5 | View completed sessions |
| Session end flow (host ends → all members notified → archive) | 1 | Clean session lifecycle |
| Empty states, loading states, error states | 1 | No blank screens |
| Drive mode UI (large buttons, minimal text, glanceable) | 1.5 | Safety-optimized layout |
| Edge case hardening (rejoin after session end, join expired link, etc.) | 1.5 | Graceful error handling |
| Internal testing (TestFlight / Android internal track) | ongoing | Real-device testing |
| Performance profiling (map rendering, socket throughput) | 1 | Identify and fix bottlenecks |

**Demo checkpoint:** Full end-to-end flow. Create session → share link → friends join → live map → coordinate with pings → end session → view history. Works on real devices over real networks.

---

## Post-MVP Roadmap (Months 4-6)

**Goal:** Retention features, app store launch, early growth.

| Feature | Priority | Effort | Notes |
|---|---|---|---|
| App store submission (iOS + Android) | P0 | L | Screenshots, descriptions, privacy policy, review prep |
| Session templates | P1 | M | Save and reuse session configs (recurring cruises, weekly hangout spots) |
| Multi-stop agenda | P1 | L | Ordered waypoints with "next stop" progression |
| Notification preferences | P1 | S | Per-user control over push types |
| Improved markers (direction, distance, animation) | P1 | M | Heading arrows, distance-to-destination |
| Advanced moderation (mute, block, report) | P2 | M | Safety tools for larger sessions |
| PostHog analytics integration | P1 | S | Session funnels, retention tracking, feature flags |
| Session replay (map timeline playback) | P2 | L | Post-session map playback of movement |
| Landing page / marketing site | P1 | M | karavyn.app web presence |

---

## Startup Expansion Roadmap (Months 6-12+)

**Goal:** Growth, monetization, and platform expansion.

| Feature | Priority | Effort | Notes |
|---|---|---|---|
| Premium tier (Stripe) | P1 | M | Larger sessions, templates, organizer tools |
| Organizer dashboard | P1 | L | Attendance, engagement, session analytics |
| Voice notes | P2 | M | Record and send short audio clips in-session |
| Voice rooms (foreground) | P3 | XL | Live voice via WebRTC. High complexity and cost. |
| Public / discoverable sessions | P2 | L | Browse nearby public sessions |
| Venue partnerships | P3 | M | "Suggested next stop" from partner venues |
| Web viewer (read-only) | P2 | L | Share a live session link viewable in browser |
| API / embed SDK | P3 | L | Let other platforms embed Karavyn coordination |
| Internationalization (i18n) | P2 | M | Multi-language support |

---

## Critical Path

The critical path through the MVP is the **real-time location pipeline**. Everything downstream depends on it.

```
Auth → Session CRUD → Socket.io Gateway → Location Streaming → Map Rendering
                                              │
                                              └→ Everything else builds on this
                                                 (roles, destinations, pings, status)
```

If the real-time foundation (Milestones 3-4) slips, everything else slips. Protect this timeline above all else. Cut coordination features (Milestone 5) before cutting real-time infrastructure.

---

## Technical Milestones (Most Important First)

1. **Socket.io gateway with auth and session rooms** — without this, nothing real-time works
2. **Location streaming pipeline (mobile → server → broadcast → map)** — the product's core value
3. **Reconnection and presence** — a "live" product that breaks on network changes is worse than no product
4. **Background location in Drive mode** — without this, the convoy use case is broken
5. **Deep link handling** — without this, the invite/growth loop is broken
6. **Push notifications** — without this, users miss session events when the app is backgrounded
7. **Batch location writes** — without this, Postgres becomes a bottleneck at moderate scale
8. **Session cleanup jobs** — without this, stale sessions and location data accumulate forever
