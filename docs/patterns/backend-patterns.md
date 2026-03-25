# Karavyn — Backend Patterns

> **Version:** 1.0
> **Last updated:** March 2026

---

## Architecture: Domain Module Pattern

The backend uses a **domain module architecture**. Each module owns a slice of the domain: its routes, service logic, data access, and validation schemas.

```
apps/api/src/
├── modules/                      # Domain modules
│   ├── auth/
│   │   ├── auth.routes.ts        # Fastify route definitions
│   │   ├── auth.service.ts       # Business logic
│   │   └── auth.middleware.ts    # JWT verification middleware
│   ├── users/
│   │   ├── users.routes.ts
│   │   ├── users.service.ts
│   │   └── users.repository.ts  # Drizzle queries
│   ├── sessions/
│   │   ├── sessions.routes.ts
│   │   ├── sessions.service.ts
│   │   ├── sessions.repository.ts
│   │   └── sessions.schema.ts   # Route-level Zod validation
│   ├── presence/
│   │   ├── presence.service.ts
│   │   └── presence.manager.ts  # In-memory presence tracking
│   ├── locations/
│   │   ├── locations.service.ts
│   │   ├── locations.repository.ts
│   │   └── locations.buffer.ts  # Batch write buffer
│   └── notifications/
│       ├── notifications.service.ts
│       └── notifications.repository.ts
│
├── realtime/                     # Socket.io gateway
│   ├── gateway.ts                # Socket.io server setup + auth middleware
│   ├── sessionManager.ts         # In-memory session state manager
│   ├── handlers/
│   │   ├── session.handler.ts    # Join/leave/rejoin events
│   │   ├── location.handler.ts   # Location update + broadcast
│   │   ├── presence.handler.ts   # Heartbeat handling
│   │   ├── ping.handler.ts       # Quick actions + status updates
│   │   └── destination.handler.ts # Destination changes
│   └── types.ts                  # Socket event types
│
├── lib/                          # Shared utilities
│   ├── errors.ts                 # Error classes
│   ├── logger.ts                 # Structured logging
│   ├── inviteCode.ts             # Invite code generation
│   └── permissions.ts            # Role-based permission checks
│
├── db/                           # Database configuration
│   ├── client.ts                 # Drizzle client initialization
│   ├── schema.ts                 # Re-export all table definitions
│   └── migrate.ts                # Migration runner
│
├── config/                       # Configuration
│   ├── env.ts                    # Typed environment variables (Zod validated)
│   └── constants.ts              # Application constants
│
├── jobs/                         # Scheduled / background jobs
│   ├── sessionCleanup.ts         # End idle sessions
│   └── locationPurge.ts          # Delete old location data
│
├── types/                        # Server-specific types
│   └── fastify.d.ts              # Fastify type extensions
│
├── app.ts                        # Fastify app setup + plugin registration
└── server.ts                     # Entry point: start HTTP + WebSocket
```

---

## Module Structure Pattern

Every domain module follows the same file convention:

### Routes (`*.routes.ts`)

Define Fastify routes. Responsible for HTTP concerns: parsing request, validating input, calling service, formatting response.

```typescript
// modules/sessions/sessions.routes.ts
import { FastifyPluginAsync } from 'fastify';
import { sessionsService } from './sessions.service';
import { createSessionSchema, joinSessionSchema } from './sessions.schema';
import { requireAuth } from '../auth/auth.middleware';

export const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAuth);

  fastify.post('/sessions', {
    schema: { body: createSessionSchema },
    handler: async (request, reply) => {
      const session = await sessionsService.create(
        request.userId,
        request.body,
      );
      return reply.status(201).send(session);
    },
  });

  fastify.post('/sessions/join', {
    schema: { body: joinSessionSchema },
    handler: async (request, reply) => {
      const session = await sessionsService.join(
        request.userId,
        request.body.inviteCode,
      );
      return reply.send(session);
    },
  });

  fastify.get('/sessions', {
    handler: async (request, reply) => {
      const sessions = await sessionsService.listForUser(request.userId);
      return reply.send(sessions);
    },
  });

  fastify.post('/sessions/:id/end', {
    handler: async (request, reply) => {
      await sessionsService.end(request.userId, request.params.id);
      return reply.status(204).send();
    },
  });
};
```

### Service (`*.service.ts`)

Business logic. Does not know about HTTP or WebSocket. Can be called from routes or socket handlers.

```typescript
// modules/sessions/sessions.service.ts
import { sessionsRepository } from './sessions.repository';
import { sessionManager } from '../../realtime/sessionManager';
import { generateInviteCode } from '../../lib/inviteCode';
import { AppError } from '../../lib/errors';
import type { CreateSessionInput, Session } from '@karavyn/shared';

class SessionsService {
  async create(userId: string, input: CreateSessionInput): Promise<Session> {
    const inviteCode = generateInviteCode();

    const session = await sessionsRepository.createWithHost(
      {
        name: input.name,
        description: input.description,
        mode: input.mode,
        inviteCode,
        hostId: userId,
      },
      userId,
    );

    // Initialize in-memory state for real-time
    sessionManager.initSession(session);

    return session;
  }

  async join(userId: string, inviteCode: string): Promise<Session> {
    const session = await sessionsRepository.findByInviteCode(inviteCode);

    if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Invalid invite code');
    if (session.status !== 'active') throw new AppError(410, 'SESSION_ENDED', 'This session has ended');

    const existingMember = await sessionsRepository.findMember(session.id, userId);
    if (existingMember && !existingMember.leftAt) {
      return session; // idempotent: already a member
    }

    await sessionsRepository.addMember(session.id, userId, 'member');
    return session;
  }

  async end(userId: string, sessionId: string): Promise<void> {
    const session = await sessionsRepository.findById(sessionId);
    if (!session) throw new AppError(404, 'SESSION_NOT_FOUND');
    if (session.hostId !== userId) throw new AppError(403, 'NOT_HOST', 'Only the host can end the session');

    await sessionsRepository.endSession(sessionId);
    sessionManager.endSession(sessionId);
  }

  async listForUser(userId: string): Promise<Session[]> {
    return sessionsRepository.findActiveByUser(userId);
  }
}

export const sessionsService = new SessionsService();
```

### Repository (`*.repository.ts`)

Data access via Drizzle. Pure database queries. No business logic.

```typescript
// modules/sessions/sessions.repository.ts
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { sessions, sessionMembers, users } from '../../db/schema';
import type { Session } from '@karavyn/shared';

class SessionsRepository {
  async createWithHost(
    sessionData: NewSession,
    hostUserId: string,
  ): Promise<Session> {
    return db.transaction(async (tx) => {
      const [session] = await tx.insert(sessions).values(sessionData).returning();
      await tx.insert(sessionMembers).values({
        sessionId: session.id,
        userId: hostUserId,
        role: 'host',
      });
      return session;
    });
  }

  async findById(id: string): Promise<Session | null> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session ?? null;
  }

  async findByInviteCode(code: string): Promise<Session | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.inviteCode, code));
    return session ?? null;
  }

  async findActiveByUser(userId: string): Promise<Session[]> {
    return db
      .select({ session: sessions })
      .from(sessions)
      .innerJoin(sessionMembers, eq(sessions.id, sessionMembers.sessionId))
      .where(
        and(
          eq(sessionMembers.userId, userId),
          eq(sessions.status, 'active'),
          isNull(sessionMembers.leftAt),
        ),
      )
      .then((rows) => rows.map((r) => r.session));
  }

  async findMember(sessionId: string, userId: string) {
    const [member] = await db
      .select()
      .from(sessionMembers)
      .where(
        and(
          eq(sessionMembers.sessionId, sessionId),
          eq(sessionMembers.userId, userId),
        ),
      );
    return member ?? null;
  }

  async addMember(sessionId: string, userId: string, role: string) {
    await db.insert(sessionMembers).values({ sessionId, userId, role });
  }

  async endSession(sessionId: string) {
    await db
      .update(sessions)
      .set({ status: 'ended', endedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }
}

export const sessionsRepository = new SessionsRepository();
```

### Schema (`*.schema.ts`)

Zod schemas for route-level request validation. Import shared schemas from `@karavyn/shared` where possible.

```typescript
// modules/sessions/sessions.schema.ts
import { z } from 'zod';
import { sessionModeSchema } from '@karavyn/shared';

export const createSessionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  mode: sessionModeSchema,
});

export const joinSessionSchema = z.object({
  inviteCode: z.string().length(6),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
```

---

## Socket.io Gateway Pattern

### Gateway Setup

```typescript
// realtime/gateway.ts
import { Server as SocketServer } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { verifyToken } from '../modules/auth/auth.middleware';
import { registerSessionHandlers } from './handlers/session.handler';
import { registerLocationHandlers } from './handlers/location.handler';
import { registerPresenceHandlers } from './handlers/presence.handler';
import { registerPingHandlers } from './handlers/ping.handler';
import { registerDestinationHandlers } from './handlers/destination.handler';
import type { ClientToServerEvents, ServerToClientEvents } from '@karavyn/shared';

export function createSocketGateway(fastify: FastifyInstance) {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(
    fastify.server,
    {
      cors: { origin: '*' }, // configure for production
      transports: ['websocket'],
    },
  );

  // Auth middleware: verify JWT on every connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token');
      const userId = await verifyToken(token);
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    registerSessionHandlers(io, socket, userId);
    registerLocationHandlers(io, socket, userId);
    registerPresenceHandlers(io, socket, userId);
    registerPingHandlers(io, socket, userId);
    registerDestinationHandlers(io, socket, userId);

    socket.on('disconnect', (reason) => {
      // Handle cleanup in presence handler
    });
  });

  return io;
}
```

### Handler Pattern

Each handler registers events for its domain. Handlers call services — they don't contain business logic themselves.

```typescript
// realtime/handlers/location.handler.ts
import { Server, Socket } from 'socket.io';
import { sessionManager } from '../sessionManager';
import { locationsService } from '../../modules/locations/locations.service';
import { locationUpdateSchema } from '@karavyn/shared';

export function registerLocationHandlers(
  io: Server,
  socket: Socket,
  userId: string,
) {
  socket.on('location:update', (data) => {
    const parsed = locationUpdateSchema.safeParse(data);
    if (!parsed.success) return; // silently drop invalid payloads

    const sessionId = sessionManager.getSessionForUser(userId);
    if (!sessionId) return;

    // Update in-memory state
    sessionManager.updateMemberLocation(sessionId, userId, parsed.data);

    // Broadcast to session room (exclude sender)
    socket.to(sessionId).emit('location:broadcast', {
      userId,
      ...parsed.data,
    });

    // Buffer for batch persistence
    locationsService.buffer({
      sessionId,
      userId,
      ...parsed.data,
    });
  });
}
```

---

## In-Memory Session State Manager

```typescript
// realtime/sessionManager.ts
import type { SessionState, MemberState } from '@karavyn/shared';

class SessionManager {
  private sessions = new Map<string, SessionState>();
  private userToSession = new Map<string, string>(); // userId → sessionId

  initSession(session: SessionFromDb): void {
    this.sessions.set(session.id, {
      sessionId: session.id,
      status: 'active',
      mode: session.mode,
      version: 0,
      createdAt: session.createdAt,
      members: new Map(),
      destination: null,
      recentEvents: [],
    });
  }

  addMember(sessionId: string, member: MemberState): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.members.set(member.userId, member);
    session.version++;
    this.userToSession.set(member.userId, sessionId);
    this.pushEvent(session, {
      type: 'member_joined',
      userId: member.userId,
      payload: { displayName: member.displayName, role: member.role },
    });
  }

  removeMember(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.members.delete(userId);
    session.version++;
    this.userToSession.delete(userId);
  }

  updateMemberLocation(sessionId: string, userId: string, location: LocationData): void {
    const session = this.sessions.get(sessionId);
    const member = session?.members.get(userId);
    if (!member) return;
    member.location = location;
    // No version increment for location — it's eventually consistent
  }

  getSessionForUser(userId: string): string | undefined {
    return this.userToSession.get(userId);
  }

  getState(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = 'ended';
    for (const userId of session.members.keys()) {
      this.userToSession.delete(userId);
    }
    // Keep in memory briefly for late reconnectors, then clean up
    setTimeout(() => this.sessions.delete(sessionId), 5 * 60 * 1000);
  }

  private pushEvent(session: SessionState, event: Omit<SessionEvent, 'createdAt'>): void {
    session.recentEvents.push({ ...event, createdAt: new Date() });
    if (session.recentEvents.length > 100) {
      session.recentEvents.shift(); // ring buffer
    }
  }
}

export const sessionManager = new SessionManager();
```

---

## Error Handling

### Typed Error Classes

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }
}

// Common errors
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}
```

### Fastify Error Handler

```typescript
// app.ts (error handler plugin)
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Zod validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: error.validation,
      },
    });
  }

  // Unexpected errors
  fastify.log.error(error);
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```

### Consistent Error Envelope

All error responses follow this shape:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Invalid invite code",
    "details": {}
  }
}
```

---

## Auth and Permission Patterns

### Auth Middleware

```typescript
// modules/auth/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { clerkClient } from '@clerk/fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  try {
    const payload = await clerkClient.verifyToken(token);
    request.userId = payload.sub;
  } catch {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}
```

### Permission Checks

Permissions are checked in the service layer, not in routes. Routes handle HTTP; services enforce business rules.

```typescript
// lib/permissions.ts
import type { MemberRole } from '@karavyn/shared';

type Permission =
  | 'session:end'
  | 'session:changeMode'
  | 'destination:set'
  | 'ping:broadcast'
  | 'member:remove'
  | 'member:promote'
  | 'member:demote';

const ROLE_PERMISSIONS: Record<MemberRole, Set<Permission>> = {
  host: new Set([
    'session:end', 'session:changeMode', 'destination:set',
    'ping:broadcast', 'member:remove', 'member:promote', 'member:demote',
  ]),
  mod: new Set([
    'destination:set', 'ping:broadcast', 'member:remove',
  ]),
  member: new Set([]),
};

export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function assertPermission(role: MemberRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Role '${role}' cannot perform '${permission}'`);
  }
}
```

---

## Logging Conventions

Use Fastify's built-in Pino logger. Structured JSON logs.

```typescript
// In route handlers and services:
fastify.log.info({ sessionId, userId }, 'Session created');
fastify.log.warn({ sessionId, userId, reason }, 'Member removed');
fastify.log.error({ err, sessionId }, 'Failed to persist location batch');
```

**Rules:**
- Always include contextual IDs (`sessionId`, `userId`) as structured fields
- Use `info` for normal operations, `warn` for degraded behavior, `error` for failures
- Never log sensitive data (tokens, passwords, precise coordinates in non-debug levels)

---

## Environment Configuration

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),
  EXPO_PUSH_ACCESS_TOKEN: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
```

Fail fast on startup if required environment variables are missing. Zod throws a clear error listing which variables are invalid or absent.

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Module directory | lowercase, singular | `modules/session/`, `modules/auth/` |
| Route file | `[module].routes.ts` | `sessions.routes.ts` |
| Service file | `[module].service.ts` | `sessions.service.ts` |
| Repository file | `[module].repository.ts` | `sessions.repository.ts` |
| Schema file | `[module].schema.ts` | `sessions.schema.ts` |
| Socket handler file | `[domain].handler.ts` | `location.handler.ts` |
| Error class | PascalCase, `Error` suffix | `NotFoundError`, `ForbiddenError` |
| Database table | snake_case, plural | `session_members`, `location_updates` |
| Database column | snake_case | `invite_code`, `created_at` |
| TypeScript type | PascalCase | `SessionState`, `MemberRole` |
| Environment variable | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `CLERK_SECRET_KEY` |
