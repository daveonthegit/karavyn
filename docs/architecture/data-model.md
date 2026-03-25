# Karavyn — Data Model and Schema Design

> **Version:** 1.0
> **Last updated:** March 2026

---

## Design Principles

1. **Relational where it matters.** Sessions, members, and roles are inherently relational. Use proper foreign keys, constraints, and transactions.
2. **Append-only for high-write data.** Location updates are append-only with TTL-based cleanup. Never update a location row — always insert.
3. **Separate hot and cold paths.** In-memory state for real-time operations. Postgres for durability and history. Don't read from Postgres in the real-time loop.
4. **Minimal schema for MVP.** Every table earns its place. No speculative tables for features that don't exist yet.

---

## Entity Relationship Overview

```
users
  │
  ├─── 1:N ──→ session_members ←── N:1 ─── sessions
  │                                           │
  │                                           ├─── 1:N ──→ destinations
  │                                           ├─── 1:N ──→ session_events
  │                                           └─── 1:N ──→ location_updates
  │
  └─── 1:N ──→ push_tokens
```

---

## Schema Definitions (Drizzle ORM)

### users

Synced from Clerk via webhook. Karavyn does not manage passwords or auth tokens — Clerk handles that entirely.

```typescript
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID (e.g., "user_2abc...")
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### sessions

The core entity. A session is a time-bounded group coordination context.

```typescript
import { pgTable, text, timestamp, varchar, pgEnum } from 'drizzle-orm/pg-core';

export const sessionModeEnum = pgEnum('session_mode', ['drive', 'walk', 'hang']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'ended']);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()), // cuid2
  hostId: text('host_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  mode: sessionModeEnum('mode').notNull().default('hang'),
  status: sessionStatusEnum('status').notNull().default('active'),
  inviteCode: varchar('invite_code', { length: 12 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### session_members

Junction table for session membership with role tracking.

```typescript
import { pgTable, text, timestamp, pgEnum, primaryKey } from 'drizzle-orm/pg-core';

export const memberRoleEnum = pgEnum('member_role', ['host', 'mod', 'member']);
export const memberStatusEnum = pgEnum('member_status', [
  'on_my_way', 'here', 'running_late'
]);

export const sessionMembers = pgTable('session_members', {
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  role: memberRoleEnum('role').notNull().default('member'),
  status: memberStatusEnum('status'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.userId] }),
}));
```

### destinations

A session can have a pinned destination. For MVP, one active destination at a time. Multi-stop agenda is Phase 2.

```typescript
import { pgTable, text, timestamp, doublePrecision, boolean, varchar } from 'drizzle-orm/pg-core';

export const destinations = pgTable('destinations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 300 }).notNull(),
  address: text('address'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  placeId: text('place_id'), // Google Maps Place ID for rich metadata
  setBy: text('set_by').references(() => users.id).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### location_updates

Append-only table for location history. High-write volume — batch inserts, TTL cleanup.

```typescript
import { pgTable, text, timestamp, doublePrecision, real, index } from 'drizzle-orm/pg-core';

export const locationUpdates = pgTable('location_updates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  heading: real('heading'),       // 0-360 degrees, null if stationary
  speed: real('speed'),           // m/s, null if stationary
  accuracy: real('accuracy').notNull(), // meters
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionTimeIdx: index('idx_location_session_time')
    .on(table.sessionId, table.recordedAt),
  userSessionIdx: index('idx_location_user_session')
    .on(table.userId, table.sessionId),
  purgeIdx: index('idx_location_created')
    .on(table.createdAt),
}));
```

### session_events

Durable log of significant session events (not location updates). Used for session history and future replay.

```typescript
import { pgTable, text, timestamp, jsonb, varchar, index } from 'drizzle-orm/pg-core';

export const sessionEvents = pgTable('session_events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionTimeIdx: index('idx_events_session_time')
    .on(table.sessionId, table.createdAt),
}));
```

**Event types:**

| Type | Payload | When |
|---|---|---|
| `member_joined` | `{ userId, displayName, role }` | User joins session |
| `member_left` | `{ userId, reason: 'left' \| 'removed' \| 'timeout' }` | User leaves/is removed |
| `role_changed` | `{ userId, oldRole, newRole, changedBy }` | Role promotion/demotion |
| `destination_set` | `{ destinationId, name, lat, lng }` | Destination pinned/changed |
| `destination_cleared` | `{ previousDestinationId }` | Destination removed |
| `mode_changed` | `{ oldMode, newMode }` | Session mode switched |
| `ping_sent` | `{ userId, pingType, scope: 'broadcast' \| 'personal' }` | Quick ping sent |
| `session_ended` | `{ endedBy, reason: 'host' \| 'timeout' \| 'empty' }` | Session ended |

### push_tokens

Stores Expo push tokens for notification delivery.

```typescript
import { pgTable, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';

export const pushTokens = pgTable('push_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull(),
  platform: varchar('platform', { length: 10 }).notNull(), // 'ios' | 'android'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_push_tokens_user').on(table.userId),
}));
```

---

## Indexing Strategy

### Primary Indexes (created by primary keys and unique constraints)

- `users.id` — primary key
- `sessions.id` — primary key
- `sessions.invite_code` — unique index (for join-by-code lookups)
- `session_members.(session_id, user_id)` — composite primary key

### Secondary Indexes

| Index | On Table | Columns | Purpose |
|---|---|---|---|
| `idx_location_session_time` | location_updates | (session_id, recorded_at) | Fetch location history for a session in time order |
| `idx_location_user_session` | location_updates | (user_id, session_id) | Fetch a user's location trail within a session |
| `idx_location_created` | location_updates | (created_at) | Efficient purge job (DELETE WHERE created_at < cutoff) |
| `idx_events_session_time` | session_events | (session_id, created_at) | Fetch session event timeline |
| `idx_push_tokens_user` | push_tokens | (user_id) | Look up a user's push tokens for notification delivery |

### Partial Indexes (consider adding when data grows)

```sql
-- Only index active sessions (most queries filter by status)
CREATE INDEX idx_sessions_active ON sessions (id) WHERE status = 'active';

-- Only index current members (not those who left)
CREATE INDEX idx_members_active ON session_members (session_id)
  WHERE left_at IS NULL;
```

---

## High-Write Patterns

### Location Updates: Batch Insert Strategy

Location data is the highest-write-volume table. Writing every update individually would create excessive Postgres load.

**Approach:** Buffer location updates in memory on the server. Flush to Postgres every 30 seconds in a single batch INSERT.

```typescript
class LocationBuffer {
  private buffer: LocationInsert[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(private db: Database, private flushIntervalMs = 30_000) {
    this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  add(update: LocationInsert) {
    this.buffer.push(update);
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);
    await this.db.insert(locationUpdates).values(batch);
  }

  async shutdown() {
    clearInterval(this.flushInterval);
    await this.flush(); // flush remaining on shutdown
  }
}
```

At 50 concurrent sessions with 10 members each in Drive mode (5s updates):
- ~100 location updates/second
- 30-second buffer = ~3,000 rows per batch INSERT
- One INSERT every 30 seconds vs 100 individual INSERTs per second
- Reduces Postgres load by ~3,000x

### Session Events: Immediate Write

Session events (joins, leaves, role changes, destination changes) are low-frequency and high-importance. Write them immediately, not batched.

---

## Retention and Cleanup

### What Gets Purged

| Data | Retention | Cleanup Method |
|---|---|---|
| `location_updates` | 7 days | Scheduled job: `DELETE FROM location_updates WHERE created_at < NOW() - INTERVAL '7 days'` |
| In-memory session state | Until session ends + 5 min | Remove from memory map after session end + grace period |
| Push tokens | Until user deletes account | Cascade delete on user deletion |

### What Gets Kept Indefinitely

| Data | Why |
|---|---|
| `users` | Account data |
| `sessions` | Session history (name, mode, duration, member count) |
| `session_members` | Participation history (who was in which session) |
| `session_events` | Event timeline (for session history view and future replay) |
| `destinations` | Session context (where the group went) |

### Cleanup Job Implementation

Run daily (or on server start if using a cron-like scheduler):

```typescript
async function purgeOldLocationData(db: Database) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await db
    .delete(locationUpdates)
    .where(lt(locationUpdates.createdAt, cutoff));
  console.log(`Purged ${result.rowCount} location records older than 7 days`);
}
```

For large tables, delete in batches to avoid long-running transactions:

```typescript
async function purgeInBatches(db: Database, batchSize = 10_000) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let totalDeleted = 0;
  let deleted: number;

  do {
    const result = await db.execute(sql`
      DELETE FROM location_updates
      WHERE id IN (
        SELECT id FROM location_updates
        WHERE created_at < ${cutoff}
        LIMIT ${batchSize}
      )
    `);
    deleted = result.rowCount ?? 0;
    totalDeleted += deleted;
  } while (deleted === batchSize);

  return totalDeleted;
}
```

---

## What Should NOT Be Persisted

| Data | Why Not | Where It Lives |
|---|---|---|
| **Presence heartbeats** | Ephemeral by nature. Only the current state matters, not the history. | In-memory `MemberState.lastHeartbeat` |
| **Current member locations** | Real-time state. Historical locations are in `location_updates`. | In-memory `MemberState.location` |
| **Socket connection IDs** | Transient, change on every reconnect. | In-memory `MemberState.socketId` |
| **Session version counter** | Only meaningful for real-time state sync. | In-memory `SessionState.version` |
| **Typing indicators** | N/A for MVP (no chat), but even if added, never persist. | In-memory or not stored at all |
| **Ephemeral pings** | Quick pings are fire-and-forget. The `session_events` table logs them for history, but the ping itself is not a durable entity. | Broadcast via Socket.io, logged as session_event |

---

## Query Patterns

### Most Common Queries

```sql
-- Get user's active sessions
SELECT s.* FROM sessions s
JOIN session_members sm ON s.id = sm.session_id
WHERE sm.user_id = :userId
  AND s.status = 'active'
  AND sm.left_at IS NULL;

-- Get session with members (for session detail / rejoin)
SELECT s.*, sm.user_id, sm.role, sm.status, sm.joined_at,
       u.display_name, u.avatar_url
FROM sessions s
JOIN session_members sm ON s.id = sm.session_id
JOIN users u ON sm.user_id = u.id
WHERE s.id = :sessionId
  AND sm.left_at IS NULL;

-- Get session by invite code (for join flow)
SELECT * FROM sessions
WHERE invite_code = :inviteCode AND status = 'active';

-- Get active destination for session
SELECT * FROM destinations
WHERE session_id = :sessionId AND is_active = true
ORDER BY created_at DESC
LIMIT 1;

-- Get session event timeline (for history)
SELECT se.*, u.display_name
FROM session_events se
LEFT JOIN users u ON se.user_id = u.id
WHERE se.session_id = :sessionId
ORDER BY se.created_at ASC;

-- Get user's session history
SELECT s.id, s.name, s.mode, s.created_at, s.ended_at,
       COUNT(sm2.user_id) as member_count
FROM sessions s
JOIN session_members sm ON s.id = sm.session_id
JOIN session_members sm2 ON s.id = sm2.session_id
WHERE sm.user_id = :userId AND s.status = 'ended'
GROUP BY s.id
ORDER BY s.created_at DESC;
```

---

## Future Schema Considerations (Not MVP)

These tables would be added in Phase 2/3 when the features they support are built:

- **session_templates:** Saved session configs for reuse (name, mode, destinations, description)
- **agenda_items:** Ordered list of stops/waypoints for multi-stop sessions
- **media:** Photos/files shared within sessions
- **reports:** User reports for moderation
- **subscriptions:** Premium tier tracking (Stripe integration)
- **venue_partnerships:** Promoted places and venue metadata

Do not create these tables until the features are being built. Speculative schema creates maintenance burden with zero value.
