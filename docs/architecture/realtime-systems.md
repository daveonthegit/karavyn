# Karavyn — Real-Time Systems Design

> **Version:** 1.0
> **Last updated:** March 2026

---

## Design Principles

1. **Server-authoritative state.** The server is the single source of truth for session membership, roles, and destinations. Clients may have optimistic local state, but the server's state wins on conflict.
2. **Eventually-consistent locations.** Location updates are best-effort, latest-write-wins. A stale location is acceptable; a wrong membership list is not.
3. **At-least-once for critical events.** Destination changes, regroup pings, and role changes use acknowledgement. Location broadcasts are fire-and-forget.
4. **Session-scoped everything.** No data leaks between sessions. No persistent location tracking. Session end = full stop.
5. **Degrade gracefully.** When real-time fails, show "last seen" timestamps instead of hiding members. Never show a false "live" indicator.

---

## Session State Model

Each active session has a server-side state object held in memory (backed by periodic Postgres snapshots):

```typescript
interface SessionState {
  sessionId: string;
  status: 'active' | 'ended';
  mode: 'drive' | 'walk' | 'hang';
  version: number; // incremented on every state mutation
  createdAt: Date;

  // Members
  members: Map<string, MemberState>;

  // Destination
  destination: {
    name: string;
    lat: number;
    lng: number;
    setBy: string; // userId
    setAt: Date;
  } | null;

  // Recent events (ring buffer, last 100)
  recentEvents: SessionEvent[];
}

interface MemberState {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'host' | 'mod' | 'member';
  status: 'on_my_way' | 'here' | 'running_late' | null;
  presence: 'active' | 'idle' | 'disconnected';
  lastHeartbeat: Date;
  location: {
    lat: number;
    lng: number;
    heading: number | null;
    speed: number | null;
    accuracy: number;
    timestamp: Date;
  } | null;
  joinedAt: Date;
  socketId: string | null; // null if disconnected
}
```

### Version Counter

Every mutation to `SessionState` increments `version`. Clients track their last known version. On reconnect, the client sends its version; the server decides whether to send a delta or full state refresh.

- If `clientVersion === serverVersion`: no update needed
- If `serverVersion - clientVersion < 50`: send missed events from `recentEvents`
- Otherwise: send full state snapshot

### Persistence Strategy

Session state lives in memory for performance. It is persisted to Postgres:
- On every membership change (join, leave, role change)
- On destination change
- On session mode change
- On session end
- Every 60 seconds as a checkpoint (for crash recovery)

If the server crashes and restarts, it rebuilds active session state from Postgres. This means at most 60 seconds of location data is lost (which is acceptable — location is ephemeral).

---

## Presence System

### Heartbeat Protocol

```
Client                          Server
  │                               │
  │── heartbeat (every 30s) ─────→│  Update lastHeartbeat timestamp
  │                               │  If was 'disconnected' → set 'active'
  │                               │  Broadcast presence change to room
  │                               │
  │  (no heartbeat for 60s)       │  Set presence = 'idle'
  │                               │  Broadcast presence change
  │                               │
  │  (no heartbeat for 90s)       │  Set presence = 'disconnected'
  │                               │  Broadcast presence change
  │                               │  Do NOT remove from session
  │                               │
  │  (no heartbeat for 30min)     │  Auto-leave: remove from session
  │                               │  Broadcast member-left
  │                               │  Persist to Postgres
```

### Presence States

| State | Meaning | Map Marker Display |
|---|---|---|
| `active` | Connected and sending heartbeats | Full-color marker, real-time position |
| `idle` | Connected but no heartbeat for 60s (app backgrounded, screen off) | Slightly dimmed marker, "idle" badge |
| `disconnected` | No heartbeat for 90s (lost connection, app killed) | Greyed-out marker at last known position, "Xm ago" label |

### Why Not Remove on Disconnect

A disconnected member is not the same as a member who left. In a convoy, someone might drive through a tunnel. At a party, someone might have their phone in their pocket. The session should show them as "disconnected at [location]" rather than removing them. They will auto-rejoin when connectivity returns.

Auto-leave after 30 minutes of disconnection handles the case where someone truly left without explicitly leaving.

---

## Location Streaming

### Update Rates by Mode

| Mode | Foreground Interval | Background Interval | Accuracy | Battery Impact |
|---|---|---|---|---|
| **Drive** | 3-5 seconds | 5-10 seconds (foreground service) | High (GPS) | Medium-High |
| **Walk** | 10-15 seconds | 30 seconds (significant change) | Medium (GPS + WiFi) | Medium |
| **Hang** | 30 seconds or geofence | Geofence only (arrived/left) | Low (WiFi + cell) | Low |

### Client-Side Location Pipeline

```
Location Provider (expo-location)
  │
  ├─ Filter: accuracy > 100m → discard (too inaccurate)
  ├─ Filter: speed === 0 && distance from last < 5m → skip (not moving)
  ├─ Filter: timestamp older than last sent → skip (out-of-order)
  │
  └─ Emit to Socket.io: "location:update"
     { lat, lng, heading, speed, accuracy, timestamp }
```

### Server-Side Location Handler

```
Receive "location:update" from client
  │
  ├─ Validate payload (Zod schema)
  ├─ Verify client is in an active session
  ├─ Update in-memory MemberState.location
  │
  ├─ Broadcast to session room: "location:broadcast"
  │   { userId, lat, lng, heading, speed, timestamp }
  │   (exclude sender — they already know their own location)
  │
  └─ Append to location buffer
     (flush to Postgres every 30 seconds in batch INSERT)
```

### Location Data Lifecycle

```
Real-time (in memory)     → 0-30s: live in MemberState
Buffer (in memory)        → 0-30s: accumulates for batch write
Postgres (location_updates) → 0-7 days: queryable for history
Purged                    → 7+ days: deleted by cleanup job
```

---

## Reconnection Handling

### Socket.io Auto-Reconnect

Socket.io client handles transport-level reconnection automatically with exponential backoff. On the server, the `connection` event fires again for the reconnected client.

### Application-Level Rejoin

Transport reconnection is not enough. The client must also rejoin the session room and reconcile state.

```
Client reconnects (new socket ID)
  │
  ├─ Client emits "session:rejoin" { sessionId, lastStateVersion }
  │
  ├─ Server validates:
  │   ├─ Is session still active?
  │   ├─ Is user still a member? (check Postgres, not just memory)
  │   └─ Does user have a valid auth token?
  │
  ├─ If all valid:
  │   ├─ Update MemberState.socketId to new socket ID
  │   ├─ Add client to Socket.io room
  │   ├─ Set presence = 'active'
  │   │
  │   ├─ If clientVersion is recent enough:
  │   │   └─ Send missed events since clientVersion
  │   ├─ Else:
  │   │   └─ Send full SessionState snapshot
  │   │
  │   └─ Broadcast "member-reconnected" to room
  │
  ├─ If session ended:
  │   └─ Send "session:ended" event with summary
  │
  └─ If user was removed:
      └─ Send "session:removed" event
```

### Missed Event Handling

The server maintains a ring buffer of the last 100 `SessionEvent` objects (membership changes, destination changes, role changes, quick pings). Each event has a `version` number.

On rejoin, if the client's `lastStateVersion` is within the buffer window, the server replays missed events in order. Otherwise, it sends a full state snapshot.

This avoids the need for a durable event log in the MVP while still handling short disconnections cleanly.

---

## Role Management

### Role Hierarchy

```
Host (session creator)
  ├─ Can: everything
  ├─ Can promote member → mod
  ├─ Can demote mod → member
  ├─ Can remove any member
  ├─ Can change destination
  ├─ Can change session mode
  ├─ Can end session
  └─ Can send broadcast pings

Mod (promoted by host)
  ├─ Can: change destination
  ├─ Can: send broadcast pings
  ├─ Can: remove members (not host or other mods)
  └─ Cannot: change mode, end session, manage mods

Member (default on join)
  ├─ Can: view map and members
  ├─ Can: set personal status (OMW / Here / Late)
  ├─ Can: send personal pings
  ├─ Can: leave session
  └─ Cannot: change destination, remove members, broadcast
```

### Permission Enforcement

Permissions are checked server-side on every action. The client UI hides controls the user can't use, but the server rejects unauthorized actions regardless of what the client sends.

```typescript
function canPerformAction(member: MemberState, action: SessionAction): boolean {
  const permissions: Record<string, Set<MemberRole>> = {
    'destination:set':    new Set(['host', 'mod']),
    'ping:broadcast':     new Set(['host', 'mod']),
    'member:remove':      new Set(['host', 'mod']),
    'member:promote':     new Set(['host']),
    'member:demote':      new Set(['host']),
    'session:end':        new Set(['host']),
    'session:changeMode': new Set(['host']),
    'status:set':         new Set(['host', 'mod', 'member']),
    'ping:personal':      new Set(['host', 'mod', 'member']),
  };
  return permissions[action]?.has(member.role) ?? false;
}
```

---

## Join / Leave / Rejoin Flows

### Join Flow

```
Client: POST /api/sessions/join { inviteCode }
  │
  ├─ Validate invite code → find session
  ├─ Check: session is active
  ├─ Check: user not already a member (idempotent: if already member, return success)
  ├─ Create session_member record in Postgres (role: 'member')
  ├─ Return session data + WebSocket connection params
  │
Client: Connect to Socket.io → emit "session:join" { sessionId }
  │
  ├─ Server adds client to room
  ├─ Server adds MemberState to in-memory SessionState
  ├─ Server broadcasts "member:joined" { userId, displayName, role }
  └─ Server sends full SessionState snapshot to joining client
```

### Leave Flow

```
Client: emit "session:leave" { sessionId }
  │
  ├─ Server removes client from room
  ├─ Server removes MemberState from in-memory SessionState
  ├─ Server updates session_member record in Postgres (leftAt = now)
  ├─ Server broadcasts "member:left" { userId }
  └─ If leaving member was last host with no other hosts:
     └─ Promote oldest mod to host, or oldest member if no mods
```

### Host Transfer on Leave

If the host leaves and there are remaining members:
1. If mods exist → oldest mod becomes host
2. If no mods → oldest member becomes host
3. Broadcast "role:changed" event to all members

If the host leaves and no members remain → end session.

---

## Privacy Boundaries

### Session-Scoped Sharing

- Location is collected and shared ONLY during active session participation
- When a session ends, location sharing stops immediately for all members
- When a user leaves a session, their location sharing stops immediately
- No cross-session location visibility (a user in Session A cannot see a user in Session B)

### Post-Session Data

- Location updates are stored for session history (7-day retention, then purged)
- Session metadata (name, mode, members, duration) is kept indefinitely
- Users can delete their participation history (removes their location data from session records)

### Location Precision

- Drive mode: full GPS precision (needed for convoy tracking)
- Walk mode: full GPS precision
- Hang mode: reduced precision (round to ~100m) unless user opts into precise sharing

### Data Minimization

- Server only stores the latest location per member in memory (not a trail)
- Postgres receives batched location snapshots (not every single update)
- Heading and speed are only transmitted in Drive and Walk modes
- No location data is shared with third parties

---

## Battery and Performance Considerations

### Mobile Battery Strategy

| Strategy | Implementation |
|---|---|
| Mode-based update rates | Drive: 3-5s, Walk: 10-15s, Hang: 30s — lower rates = less GPS usage |
| Significant-change filter | Skip updates where position hasn't changed meaningfully (< 5m movement) |
| Accuracy-based filtering | Discard updates with accuracy > 100m (GPS hasn't locked) |
| Background mode limits | Only Drive mode uses active background location. Walk/Hang use significant-change API or geofence only. |
| Batch socket emissions | Buffer 2-3 location updates and send as one message (reduces radio wake-ups) |
| Screen-off optimization | Reduce map rendering framerate when screen is off (no visual updates needed) |

### Server Performance Strategy

| Strategy | Implementation |
|---|---|
| In-memory session state | No database read for real-time operations. Postgres is write-behind only. |
| Batch location writes | Buffer location updates for 30 seconds, then batch INSERT to Postgres |
| Exclude sender from broadcast | Don't send a member's location back to themselves (reduces outbound messages by 1/N) |
| Binary payloads | Use Socket.io's binary encoding for location updates (smaller than JSON) |
| Room-scoped broadcast | Socket.io rooms ensure messages only go to session members, not all connected clients |

### Expected Resource Usage (MVP)

Assume 50 concurrent sessions, 10 members average, Drive mode:
- Inbound location updates: ~100 messages/second
- Outbound broadcasts: ~900 messages/second (each update broadcast to ~9 other members)
- Memory: ~50 SessionState objects ≈ 5-10 MB
- Postgres writes: ~3-5 batch INSERTs/second (location buffer flush)

A single Railway instance (1 GB RAM, shared CPU) handles this comfortably.

---

## Background Location Constraints

### iOS

**Foreground:** Full GPS access via `expo-location` `watchPositionAsync`. Works perfectly.

**Background:** iOS is aggressive about killing background processes. Options:
1. **Significant Location Change monitoring:** iOS wakes the app for ~10 seconds when location changes by ~500m. Coarse but battery-efficient. Use for Walk/Hang modes.
2. **Background Location Updates (continuous):** Requires `UIBackgroundModes: location` in Info.plist. iOS allows this but App Store review scrutinizes it. Must justify as core to the app's purpose. Use for Drive mode.
3. **Foreground Service (not available on iOS):** iOS has no equivalent. The app must remain in the foreground or use option 1/2.

**App Store Review Requirement:** "This app uses background location for real-time group coordination during active driving sessions. Location sharing is session-scoped and stops automatically when the session ends."

### Android

**Foreground:** Same as iOS — full access.

**Background:**
1. **Foreground Service with notification:** Android allows continuous background location if a persistent notification is shown. This is the correct approach for Drive mode. Users see "Karavyn: Sharing your location in [Session Name]."
2. **ACCESS_BACKGROUND_LOCATION permission:** Required for Android 10+. Google Play requires a separate permission declaration and review.
3. **Battery optimization:** Many Android OEMs (Samsung, Xiaomi, Huawei) aggressively kill background processes. The app should guide users to disable battery optimization for Karavyn.

### Practical Approach for MVP

| Mode | iOS Foreground | iOS Background | Android Foreground | Android Background |
|---|---|---|---|---|
| Drive | Full GPS, 3-5s | Continuous background location | Full GPS, 3-5s | Foreground service, 5-10s |
| Walk | GPS, 10-15s | Significant change only | GPS, 10-15s | Significant change only |
| Hang | WiFi/Cell, 30s | Geofence only | WiFi/Cell, 30s | Geofence only |

---

## MVP Simplifications

These are intentional scope reductions for the MVP that can be expanded later:

| Simplification | What We Skip | Why It's OK |
|---|---|---|
| **Single server** | No Redis pub/sub, no horizontal WebSocket scaling | A single server handles 50-100 concurrent sessions. Scaling is a growth-stage problem. |
| **In-memory session state** | No Redis for hot state | Memory is fast and simple. Periodic Postgres snapshots handle crash recovery. |
| **No event sourcing** | Session state is mutable, not event-sourced | Ring buffer of recent events handles reconnection. Full event sourcing is overengineering for MVP. |
| **No CRDT / OT** | No conflict-free replicated data types | Server-authoritative model is simpler and correct for this domain. Members don't collaboratively edit shared state. |
| **No message queue** | No Kafka, RabbitMQ, or BullMQ | Direct function calls for all processing. Add a queue when background jobs become complex (Phase 2). |
| **Simple geo** | No PostGIS, no geospatial indexes | Store lat/lng as floats. Distance calculations in application code. Add PostGIS when proximity features ship. |
| **No rate limiting on location** | Trust the client's update interval | Add server-side rate limiting if abuse becomes a problem. |
