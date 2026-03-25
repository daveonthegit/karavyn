# Karavyn — Shared Types and Contracts

> **Version:** 1.0
> **Last updated:** March 2026

---

## Overview

The `packages/shared` workspace package is the **single source of truth** for all types, schemas, and contracts shared between the mobile app and the API server. Both apps import from `@karavyn/shared`.

This eliminates frontend/backend type drift: if a schema changes, both sides get the update via the monorepo's dependency resolution, and TypeScript catches mismatches at compile time.

---

## Package Structure

```
packages/shared/
├── src/
│   ├── schemas/                  # Zod schemas (validation + type inference)
│   │   ├── session.ts
│   │   ├── user.ts
│   │   ├── location.ts
│   │   ├── destination.ts
│   │   ├── ping.ts
│   │   └── index.ts             # Re-exports all schemas
│   │
│   ├── events/                   # WebSocket event type definitions
│   │   ├── client-events.ts     # Client → Server events
│   │   ├── server-events.ts     # Server → Client events
│   │   └── index.ts
│   │
│   ├── types/                    # Pure TypeScript types (no runtime)
│   │   ├── session.ts
│   │   ├── user.ts
│   │   ├── member.ts
│   │   ├── destination.ts
│   │   ├── presence.ts
│   │   └── index.ts
│   │
│   ├── constants/                # Shared constants
│   │   ├── modes.ts
│   │   ├── roles.ts
│   │   ├── statuses.ts
│   │   ├── pings.ts
│   │   └── index.ts
│   │
│   └── index.ts                  # Package entry point
│
├── package.json
└── tsconfig.json
```

---

## Zod Schemas: Single Source of Truth

Define schemas once in Zod. Infer TypeScript types from them. Use the schemas for runtime validation on both frontend and backend.

```typescript
// schemas/session.ts
import { z } from 'zod';

export const sessionModeSchema = z.enum(['drive', 'walk', 'hang']);
export const sessionStatusSchema = z.enum(['active', 'ended']);

export const createSessionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  mode: sessionModeSchema,
});

export const sessionSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  mode: sessionModeSchema,
  status: sessionStatusSchema,
  inviteCode: z.string(),
  createdAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
});

// Infer types from schemas
export type SessionMode = z.infer<typeof sessionModeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;
```

```typescript
// schemas/location.ts
import { z } from 'zod';

export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).nullable(),
  speed: z.number().min(0).nullable(),
  accuracy: z.number().min(0),
  timestamp: z.string().datetime(),
});

export type LocationUpdate = z.infer<typeof locationUpdateSchema>;
```

```typescript
// schemas/ping.ts
import { z } from 'zod';

export const pingTypeSchema = z.enum(['regroup', 'moving', 'need_help', 'stopping']);
export const memberStatusSchema = z.enum(['on_my_way', 'here', 'running_late']);

export type PingType = z.infer<typeof pingTypeSchema>;
export type MemberStatus = z.infer<typeof memberStatusSchema>;
```

---

## WebSocket Event Contracts

Type-safe event definitions that Socket.io uses for both client and server. These types are passed to Socket.io's generic parameters.

### Client → Server Events

```typescript
// events/client-events.ts
import type { LocationUpdate, PingType, MemberStatus } from '../schemas';

export interface ClientToServerEvents {
  // Session lifecycle
  'session:join': (data: { sessionId: string }) => void;
  'session:leave': (data: { sessionId: string }) => void;
  'session:rejoin': (data: { sessionId: string; lastStateVersion: number }) => void;

  // Location
  'location:update': (data: LocationUpdate) => void;

  // Presence
  'presence:heartbeat': () => void;

  // Actions
  'ping:send': (data: { type: PingType; scope: 'broadcast' | 'personal' }) => void;
  'status:set': (data: { status: MemberStatus | null }) => void;

  // Destination (host/mod only)
  'destination:set': (data: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    placeId?: string;
  }) => void;
  'destination:clear': () => void;

  // Roles (host only)
  'member:promote': (data: { userId: string; role: 'mod' }) => void;
  'member:demote': (data: { userId: string }) => void;
  'member:remove': (data: { userId: string }) => void;

  // Session control (host only)
  'session:changeMode': (data: { mode: 'drive' | 'walk' | 'hang' }) => void;
  'session:end': () => void;
}
```

### Server → Client Events

```typescript
// events/server-events.ts
import type { LocationUpdate, PingType, MemberStatus } from '../schemas';

export interface ServerToClientEvents {
  // Session state
  'session:state': (data: SessionStateSnapshot) => void;
  'session:ended': (data: { endedBy: string; reason: string }) => void;
  'session:modeChanged': (data: { mode: 'drive' | 'walk' | 'hang' }) => void;

  // Members
  'member:joined': (data: MemberInfo) => void;
  'member:left': (data: { userId: string; reason: 'left' | 'removed' | 'timeout' }) => void;
  'member:roleChanged': (data: { userId: string; role: string }) => void;

  // Location
  'location:broadcast': (data: { userId: string } & LocationUpdate) => void;

  // Presence
  'presence:update': (data: { userId: string; presence: 'active' | 'idle' | 'disconnected' }) => void;

  // Actions
  'ping:received': (data: {
    userId: string;
    displayName: string;
    type: PingType;
    scope: 'broadcast' | 'personal';
  }) => void;
  'status:changed': (data: { userId: string; status: MemberStatus | null }) => void;

  // Destination
  'destination:updated': (data: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    setBy: string;
  } | null) => void;

  // Reconnection
  'session:missedEvents': (data: SessionEvent[]) => void;

  // Errors
  'error': (data: { code: string; message: string }) => void;
}

// Supporting types
interface SessionStateSnapshot {
  sessionId: string;
  name: string;
  mode: 'drive' | 'walk' | 'hang';
  status: 'active' | 'ended';
  version: number;
  members: MemberInfo[];
  destination: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    setBy: string;
  } | null;
}

interface MemberInfo {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'host' | 'mod' | 'member';
  status: MemberStatus | null;
  presence: 'active' | 'idle' | 'disconnected';
  location: LocationUpdate | null;
  joinedAt: string;
}
```

---

## REST API Contracts

### Request/Response Types

```typescript
// types/session.ts
import type { Session, CreateSessionInput, SessionMode } from '../schemas';

// POST /api/sessions
export interface CreateSessionRequest {
  body: CreateSessionInput;
}
export interface CreateSessionResponse extends Session {
  inviteLink: string;
}

// POST /api/sessions/join
export interface JoinSessionRequest {
  body: { inviteCode: string };
}
export type JoinSessionResponse = Session;

// GET /api/sessions
export type ListSessionsResponse = Session[];

// GET /api/sessions/:id
export type GetSessionResponse = Session & {
  members: MemberInfo[];
  destination: DestinationInfo | null;
};

// POST /api/sessions/:id/end
// Response: 204 No Content
```

### Error Response Shape

All error responses follow this contract:

```typescript
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## Constants

```typescript
// constants/modes.ts
export const SESSION_MODES = ['drive', 'walk', 'hang'] as const;
export const MODE_LABELS: Record<string, string> = {
  drive: 'Drive',
  walk: 'Walk',
  hang: 'Hang',
};

// constants/roles.ts
export const MEMBER_ROLES = ['host', 'mod', 'member'] as const;
export const ROLE_LABELS: Record<string, string> = {
  host: 'Host',
  mod: 'Mod',
  member: 'Member',
};

// constants/pings.ts
export const PING_TYPES = ['regroup', 'moving', 'need_help', 'stopping'] as const;
export const PING_LABELS: Record<string, string> = {
  regroup: 'Regroup',
  moving: 'Moving',
  need_help: 'Need Help',
  stopping: 'Stopping',
};

// constants/statuses.ts
export const MEMBER_STATUSES = ['on_my_way', 'here', 'running_late'] as const;
export const STATUS_LABELS: Record<string, string> = {
  on_my_way: 'On My Way',
  here: 'Here',
  running_late: 'Running Late',
};
```

---

## Preventing Frontend/Backend Drift

### Compile-Time Safety

Both `apps/mobile` and `apps/api` import from `@karavyn/shared`. TypeScript ensures:
- If a schema field is added, both sides must handle it
- If an event name changes, both sides must update their handlers
- If a type is removed, both sides get compile errors

### CI Checks

Turborepo's `turbo run typecheck` runs TypeScript type checking across all packages. If the shared package changes in a way that breaks an app, CI catches it before merge.

### Versioning

For MVP (single developer, monorepo), explicit versioning of the shared package is unnecessary — the monorepo's workspace resolution ensures both apps always use the latest code.

If the project later has separate deployment pipelines for mobile and backend, the shared package should follow semver:
- **Patch:** Bug fixes, documentation
- **Minor:** New fields, new events (backward-compatible additions)
- **Major:** Removed fields, changed event shapes, renamed types (breaking changes)

---

## Package Entry Point

```typescript
// packages/shared/src/index.ts

// Schemas (Zod — runtime validation + type inference)
export * from './schemas';

// Event contracts (Socket.io typed events)
export * from './events';

// Types (pure TypeScript — no runtime)
export * from './types';

// Constants
export * from './constants';
```

Usage in apps:

```typescript
// In mobile or API code:
import {
  createSessionSchema,
  type Session,
  type ClientToServerEvents,
  type ServerToClientEvents,
  PING_TYPES,
  ROLE_LABELS,
} from '@karavyn/shared';
```
