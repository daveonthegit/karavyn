# ADR-002: Real-Time Transport

> **Status:** Accepted
> **Date:** March 2026
> **Decision:** Socket.io

---

## Context

Karavyn's core product is a live session where multiple users share location and coordination state in real time. The transport layer must support:
- Bidirectional communication (clients send location, server broadcasts to group)
- Room-based grouping (each session = one room)
- Authentication on connection
- Automatic reconnection with state recovery
- Efficient broadcasting (one update → N members receive it)
- Reasonable client bundle size for mobile

## Decision

Use **Socket.io** (`socket.io` server, `socket.io-client` client) as the real-time transport layer.

## Rationale

- **Room abstraction maps directly to sessions.** Each Karavyn session is a Socket.io room. `io.to(sessionId).emit()` broadcasts to exactly the right users. No custom routing logic needed.
- **Built-in reconnection** with configurable exponential backoff. Socket.io clients automatically reconnect after network disruption without application code.
- **Auth middleware on handshake.** Verify Clerk JWT during the Socket.io connection handshake, before any messages are exchanged. Unauthorized connections are rejected immediately.
- **Binary data support.** Location payloads can be sent as binary (more compact than JSON), reducing bandwidth for high-frequency updates.
- **Transport fallback.** If WebSocket is blocked (some corporate networks, proxies), Socket.io falls back to HTTP long-polling transparently.
- **Mature ecosystem.** Socket.io has been production-tested for 10+ years. Extensive documentation, community support, and known patterns.
- **Redis adapter for scaling.** When Karavyn outgrows a single server, `@socket.io/redis-adapter` enables horizontal scaling across multiple server instances with minimal code changes.

## Consequences

- **Positive:** Saves weeks of development on reconnection, room management, and auth that would need to be built manually with raw WebSockets.
- **Negative:** Slightly larger client bundle than raw WebSocket (~40KB gzipped). Acceptable for a mobile app.
- **Negative:** Socket.io uses its own protocol on top of WebSocket, which means you cannot connect with a plain WebSocket client. This is fine since both client and server are controlled.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Raw WebSocket (`ws`)** | No rooms, no reconnection, no auth middleware, no binary encoding, no multiplexing. You'd end up rebuilding Socket.io's feature set manually. |
| **Server-Sent Events (SSE)** | Unidirectional (server → client). Location streaming is bidirectional (client sends location, server broadcasts). Disqualified. |
| **Supabase Realtime** | Channel-based, not room-based. Limited middleware support. Cannot do "broadcast to session X excluding sender." Insufficient control for custom session logic. |
| **Ably / Pusher** | Managed real-time services. Per-message pricing would be expensive for high-frequency location updates. Loss of control over transport behavior. Vendor lock-in. |
