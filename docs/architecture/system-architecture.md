# Karavyn — System Architecture

> **Version:** 1.0
> **Last updated:** March 2026

---

## Architecture Overview

Karavyn is a real-time, mobile-first group coordination platform. The architecture is designed for a solo founder: maximum leverage from managed services, minimal operational overhead, full TypeScript stack for one-person velocity, and a clean scaling path from MVP to production.

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                            │
│              Expo (React Native) + TypeScript                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Clerk   │  │ TanStack │  │  Zustand  │  │  Socket.io │  │
│  │  Auth UI │  │  Query   │  │  Stores   │  │  Client    │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └─────┬──────┘  │
│       │              │                             │         │
│       │         REST API (HTTPS)            WebSocket (WSS)  │
└───────┼──────────────┼─────────────────────────────┼─────────┘
        │              │                             │
┌───────┴──────────────┴─────────────────────────────┴─────────┐
│                      Backend Server                           │
│               Node.js + Fastify + TypeScript                  │
│                                                               │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐  │
│  │  REST Routes  │  │  Socket.io    │  │  Background Jobs  │  │
│  │  (Fastify)   │  │  Gateway      │  │  (session cleanup, │  │
│  │              │  │  (rooms,      │  │   location purge)  │  │
│  │  - sessions  │  │   presence,   │  │                    │  │
│  │  - users     │  │   location,   │  └────────────────────┘  │
│  │  - invites   │  │   pings)      │                          │
│  └──────┬───────┘  └──────┬────────┘                          │
│         │                 │                                   │
│  ┌──────┴─────────────────┴────────┐  ┌────────────────────┐  │
│  │        Service Layer            │  │  In-Memory State   │  │
│  │  (session, presence, location)  │  │  (hot sessions,    │  │
│  └──────────────┬──────────────────┘  │   presence, locs)  │  │
│                 │                     └────────────────────┘  │
└─────────────────┼────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │   Neon Postgres    │
        │   (serverless)     │
        │                    │
        │  - users           │
        │  - sessions        │
        │  - session_members │
        │  - destinations    │
        │  - location_updates│
        │  - session_events  │
        └────────────────────┘
```

### External Services

```
┌───────────────────┐  ┌────────────────┐  ┌──────────────────┐
│     Clerk          │  │  Google Maps   │  │  Expo Push       │
│  (auth, user mgmt) │  │  Platform      │  │  Notification    │
│                    │  │  (maps, places)│  │  Service          │
└────────────────────┘  └────────────────┘  └──────────────────┘
```

---

## Stack Decisions with Justification

### Mobile: Expo (React Native) + TypeScript

**Why:** One codebase for iOS and Android. Expo provides managed native builds (EAS Build), OTA updates (EAS Update), file-based routing (Expo Router), and a massive library ecosystem. A solo founder cannot maintain two native codebases.

**Alternatives rejected:**
- **Flutter:** Excellent framework, but requires learning Dart. The rest of the stack is TypeScript — context-switching languages adds cognitive overhead for a solo developer.
- **Native (Swift + Kotlin):** 2x the codebase for a solo founder. Not viable.
- **PWA:** No background location, no push notifications on iOS (limited), no app store presence. Disqualified for a location-heavy mobile product.

**Key libraries:**
- `expo-location` — foreground and background location
- `expo-notifications` — push notifications
- `react-native-maps` — Google Maps integration
- `expo-router` — file-based navigation
- `@clerk/clerk-expo` — auth UI and session management
- `socket.io-client` — real-time connection
- `zustand` — client state
- `@tanstack/react-query` — server state and caching

### Backend: Node.js + Fastify + TypeScript

**Why:** Fastify is the fastest mainstream Node.js framework (~30k req/s vs Express's ~10k). First-class TypeScript support with type providers. Excellent plugin system for clean architecture. Native support for WebSocket upgrade (Socket.io attaches cleanly).

**Alternatives rejected:**
- **Express:** Slower, less structured, TypeScript is bolted on rather than native.
- **NestJS:** Good for large teams, but heavy decorator-based framework is overengineered for a solo founder. Adds boilerplate without proportional value.
- **tRPC:** Excellent for type-safe API, but adding Socket.io alongside tRPC creates two parallel transport systems. Fastify with Zod validation gives comparable type safety with simpler architecture.
- **Hono / Elysia:** Modern and fast, but less mature ecosystem and fewer production references.

**Key libraries:**
- `fastify` — HTTP server
- `socket.io` — real-time gateway
- `drizzle-orm` — type-safe database queries
- `@clerk/fastify` — JWT verification middleware
- `zod` — request/response validation
- `bullmq` (Phase 2) — background job queue

### Real-time: Socket.io

**Why:** Socket.io's room abstraction maps directly to Karavyn's session model. Each session = one room. Broadcasting to a session = `io.to(sessionId).emit()`. Built-in reconnection with exponential backoff. Auth middleware on the handshake. Binary data support for efficient location payloads. Fallback to long-polling if WebSocket fails.

**Alternatives rejected:**
- **Raw WebSocket (ws):** No rooms, no reconnection, no auth middleware, no multiplexing. You'd rebuild half of Socket.io.
- **SSE (Server-Sent Events):** Unidirectional (server → client). Location updates are bidirectional (client sends location, server broadcasts). Disqualified.
- **Supabase Realtime:** Channel-based, not room-based. Limited middleware support. Can't do fine-grained broadcast control (e.g., "broadcast to everyone in session X except sender").

### Database: PostgreSQL on Neon + Drizzle ORM

**Why Postgres:** Sessions, members, roles, and destinations are inherently relational. JOINs, foreign keys, transactions, and CHECK constraints model this domain naturally. PostGIS extension enables geospatial queries when needed.

**Why Neon:** Serverless Postgres — scales to zero (no charges when idle), wakes in ~200ms, database branching for dev/staging, generous free tier (0.5 GB, 190 compute-hours/month). Ideal for a solo founder: no database administration, no idle costs during development.

**Why Drizzle:** Type-safe query builder that infers TypeScript types from schema definitions. Lightweight (no heavy runtime like Prisma's query engine). Schema-first migrations. Works natively with Neon's serverless driver (`@neondatabase/serverless`).

**Alternatives rejected:**
- **MongoDB:** Document model is a poor fit for relational data (sessions have members have roles). No JOINs means denormalization and data consistency headaches.
- **Supabase (Postgres):** Good product, but if you're not using Supabase Auth or Realtime, you're paying for a platform you're not using. Neon is a better pure-Postgres host.
- **PlanetScale:** MySQL-based, no foreign keys (by design), less ecosystem for geo queries.
- **Prisma (ORM):** Heavy runtime binary, slower cold starts, type generation step adds build complexity. Drizzle is lighter and faster.

### Auth: Clerk

**Why:** Best React Native auth SDK available. Pre-built `<SignIn />` and `<SignUp />` components save weeks of UI work. Social login (Google, Apple) out of the box. JWT-based — Fastify middleware verifies the token on every request. Webhook-based user sync to your database. 10,000 MAU free tier.

**Alternatives rejected:**
- **Supabase Auth:** Functional but React Native SDK requires more custom UI work. Less polished mobile experience.
- **Firebase Auth:** Good SDK, but pulls you into the Firebase ecosystem. No pre-built RN UI components.
- **Custom JWT:** Weeks of security-critical code (password hashing, token rotation, OAuth flows) that a solo founder shouldn't build.

### Maps: Google Maps Platform + react-native-maps

**Why:** Best Points of Interest (POI) data for destination search. $200/month free credit covers development and early production. `react-native-maps` uses Google Maps as the default provider on Android and supports it on iOS. Familiar API.

**Alternatives rejected:**
- **Mapbox:** Better customization and styling, but weaker POI data. For Karavyn, destination search quality matters more than map aesthetics.
- **Apple Maps (MapKit):** iOS only.

### Push Notifications: Expo Notifications

**Why:** Free, zero-config for Expo apps. Abstracts iOS APNs and Android FCM behind a single API. Push tokens managed automatically by the Expo SDK. Server sends to Expo's push service, which handles delivery.

### Hosting: Railway

**Why:** Simple deploy-from-GitHub workflow. Native WebSocket support (critical for Socket.io). Postgres add-on available (backup option to Neon). $5/month hobby plan with generous resource limits. Health checks, logs, and metrics built in.

**Scaling path:** When Karavyn outgrows a single Railway instance, migrate the API to **Fly.io** for multi-region deployment with persistent WebSocket connections. Fly.io's Machines API supports autoscaling and geographic routing.

### Monorepo: Turborepo + pnpm

**Why:** Shared TypeScript types between mobile and API via a `packages/shared` workspace. Turborepo's caching makes builds fast. pnpm's strict dependency resolution prevents phantom dependencies. Industry-standard for TypeScript monorepos.

---

## Data Flow Diagrams

### Session Creation

```
User taps "Create Session"
  → Mobile sends POST /api/sessions (name, mode, description)
  → Fastify validates request (Zod schema)
  → Service creates session record in Postgres
  → Service generates invite code (6-char alphanumeric)
  → Service generates deep link: karavyn.app/join/{inviteCode}
  → Returns session object + invite link + QR data
  → Mobile displays session screen with share options
```

### Join Session via Invite Link

```
User taps invite link (karavyn.app/join/{inviteCode})
  → Expo Router handles deep link
  → If not authenticated: redirect to sign-in → then continue
  → Mobile sends POST /api/sessions/join (inviteCode)
  → Fastify validates invite code, checks session is active
  → Service creates session_member record (role: member)
  → Returns session object with full state
  → Mobile connects to Socket.io with session ID
  → Socket.io server adds client to session room
  → Server broadcasts "member-joined" to room
  → Mobile renders session screen (map, members, destination)
```

### Location Update Broadcast Cycle

```
Mobile location provider fires update (mode-based interval)
  → Client emits socket event: "location:update" { lat, lng, heading, speed, accuracy, timestamp }
  → Socket.io server receives in session room handler
  → Server validates payload (Zod)
  → Server updates in-memory state (latest location for this member)
  → Server broadcasts to session room: "location:broadcast" { userId, lat, lng, heading, speed, timestamp }
  → Periodically (every 30s): server batches location updates to Postgres for history
  → All other members' map markers update in real time
```

### Reconnection After Disconnect

```
Client detects socket disconnect (network change, background kill, etc.)
  → Socket.io client auto-reconnects with exponential backoff
  → On reconnect: client sends "session:rejoin" { sessionId, lastStateVersion }
  → Server checks: is user still a member of this session? Is session still active?
  → If yes: re-add to room, send full current state (members, locations, destination, version)
  → Client reconciles state: update member list, positions, destination
  → If session ended while disconnected: notify user, show session history
  → If user was removed while disconnected: notify user, redirect to home
```

---

## Startup Evolution Architecture

### MVP (Single Server)

```
Mobile App ←→ Railway (Fastify + Socket.io) ←→ Neon Postgres
```

All state fits in one server. In-memory session state (Map objects). Postgres for durability. This handles ~50-100 concurrent sessions with ~500-1000 connected users comfortably on a single Railway instance.

### Scale Phase 1: Add Redis (100-1000 concurrent sessions)

```
Mobile App ←→ Railway Instance 1 ←→ Upstash Redis (pub/sub + cache)
             ←→ Railway Instance 2 ←→ Neon Postgres
```

Socket.io's Redis adapter (`@socket.io/redis-adapter`) enables horizontal scaling. Multiple server instances share session rooms via Redis pub/sub. Hot session state moves from in-memory Maps to Redis. Upstash (serverless Redis) keeps operational overhead minimal.

### Scale Phase 2: Multi-Region (1000+ concurrent sessions)

```
Mobile App ←→ Fly.io (multi-region, autoscaled)
             ←→ Upstash Redis (global replication)
             ←→ Neon Postgres (read replicas)
             ←→ CDN (static assets)
```

Fly.io deploys instances in regions close to users. Upstash Global replicates Redis across regions. Neon read replicas handle query load. Event log (append-only Postgres table or dedicated service like Kafka) captures all session events for replay and analytics.

---

## Failure Mode Catalog

| Failure Mode | Impact | Detection | Mitigation |
|---|---|---|---|
| **WebSocket disconnect during drive** | User disappears from map until reconnect | Socket.io disconnect event, heartbeat timeout | Auto-reconnect with backoff. Server shows "last seen" timestamp. Other members see stale marker with "disconnected" indicator. |
| **iOS kills app in background** | Location streaming stops | No heartbeat received (90s timeout) | Use significant-location-change API for coarse updates. Show "last seen" to other members. Push notification to user: "Karavyn paused — tap to resume." |
| **Android kills background service** | Location streaming stops | Same as iOS | Use foreground service with persistent notification. Request battery optimization exemption. |
| **Neon cold start** | First API request after idle has ~200-500ms extra latency | Monitor P99 latency | Acceptable for MVP. Neon's autosuspend is configurable (can keep alive on paid plan). |
| **Stale location displayed** | Map shows outdated member position | Compare location timestamp to current time | Show "Xm ago" on stale markers. Dim markers older than 60s. Hide markers older than 5m with "lost connection" status. |
| **Split-brain membership** | Two servers disagree on who's in a session | N/A for single-server MVP | Server-authoritative membership in Postgres. On reconnect, always fetch fresh membership from DB. |
| **Race condition: simultaneous join/leave** | Inconsistent member list | Duplicate member events, count mismatches | Use Postgres transactions for membership changes. Idempotent operations (joining when already a member is a no-op). |
| **Invite link shared publicly** | Unwanted members join session | Unexpected session size, reports from host | Host can remove members. Phase 2: session passwords, approval-required joins, member limits. |

---

## Cost Analysis

### Development Phase ($0/month)

| Service | Free Tier |
|---|---|
| Neon Postgres | 0.5 GB storage, 190 compute-hours/month |
| Clerk | 10,000 MAU |
| Railway | $5 trial credit (or use free tier) |
| Google Maps | $200/month credit |
| Expo / EAS | Free tier (limited builds, unlimited OTA updates) |
| PostHog | 1M events/month |

### Early Production ($10-25/month)

| Service | Cost |
|---|---|
| Railway (API server) | $5/month (hobby) |
| Neon Postgres | $0-19/month (free → Launch plan) |
| Clerk | $0 (under 10k MAU) |
| Google Maps | $0 (under $200 credit) |
| Expo / EAS | $0-29/month (free → production builds) |
| Domain + DNS | ~$12/year |

### Growth Phase ($50-200/month at 10k+ MAU)

| Service | Cost |
|---|---|
| Railway or Fly.io | $20-50/month |
| Neon Postgres (Scale plan) | $19-69/month |
| Clerk | $25/month (10k+ MAU) |
| Upstash Redis | $0-10/month |
| Google Maps | $0-50/month (depends on session volume) |
| Expo EAS (production) | $29/month |
| PostHog | $0-50/month |

---

## Operational Checklist for Solo Founder

### What you must monitor

- **Socket.io connection count** — if it spikes or drops to zero, something is wrong
- **API response times (P50, P99)** — catch Neon cold starts or slow queries
- **Error rate** — 5xx responses, socket errors, auth failures
- **Active sessions count** — basic product health signal

### What's managed for you

- Database backups and scaling (Neon)
- Auth security, token rotation, social provider integration (Clerk)
- Push notification delivery (Expo Push Service → APNs/FCM)
- TLS certificates (Railway)
- Build signing and distribution (EAS Build)

### What you should automate early

- **Session cleanup job:** End sessions that have been idle (no heartbeat from any member) for > 2 hours
- **Location purge job:** Delete location_updates older than 7 days
- **Health check endpoint:** `GET /health` returns 200 with DB connection status
