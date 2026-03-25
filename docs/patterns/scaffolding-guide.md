# Karavyn — Starter Scaffolding Guide

> **Version:** 1.0
> **Last updated:** March 2026

---

## Overview

This guide walks through initializing the Karavyn monorepo from scratch and building the first stable modules. By the end, you'll have a working codebase where two phones can create/join a session and see each other on a live map.

---

## Step 1: Initialize Monorepo

```bash
# Create the project directory
mkdir karavyn && cd karavyn

# Initialize pnpm workspace
pnpm init
```

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```bash
# Install Turborepo
pnpm add -D turbo

# Create turbo.json (see repo-structure.md for full config)

# Create directory structure
mkdir -p apps/mobile apps/api packages/shared packages/eslint-config packages/tsconfig docs
```

---

## Step 2: Set Up Shared Package

```bash
cd packages/shared
pnpm init
# Set package name to "@karavyn/shared" in package.json
```

Install Zod:
```bash
pnpm add zod
pnpm add -D typescript
```

Create the initial schemas and types. Start with the minimum needed for session creation:

**First files to create (in order):**

1. `packages/shared/src/constants/modes.ts` — session modes
2. `packages/shared/src/constants/roles.ts` — member roles
3. `packages/shared/src/schemas/session.ts` — create session schema + Session type
4. `packages/shared/src/schemas/location.ts` — location update schema
5. `packages/shared/src/events/client-events.ts` — client → server Socket.io events
6. `packages/shared/src/events/server-events.ts` — server → client Socket.io events
7. `packages/shared/src/index.ts` — re-export everything

This gives both apps a contract to build against from day one.

---

## Step 3: Set Up Backend (Fastify API)

```bash
cd apps/api
pnpm init
# Set package name to "api" in package.json

# Install dependencies
pnpm add fastify socket.io drizzle-orm @neondatabase/serverless zod @clerk/fastify dotenv
pnpm add -D typescript @types/node tsx vitest drizzle-kit

# Add workspace dependency
pnpm add @karavyn/shared --workspace
```

**First files to create (in order):**

1. **`src/config/env.ts`** — Zod-validated environment variables. The app won't start without DATABASE_URL and CLERK_SECRET_KEY.

2. **`src/db/schema.ts`** — Drizzle schema for `users`, `sessions`, `session_members`. Import from your schema files (see data-model.md).

3. **`src/db/client.ts`** — Initialize Drizzle with Neon serverless driver.

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { env } from '../config/env';
import * as schema from './schema';

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

4. **`src/lib/errors.ts`** — AppError class (see backend-patterns.md).

5. **`src/modules/auth/auth.middleware.ts`** — Clerk JWT verification.

6. **`src/modules/sessions/sessions.repository.ts`** — Basic CRUD queries.

7. **`src/modules/sessions/sessions.service.ts`** — Create, join, list, end.

8. **`src/modules/sessions/sessions.routes.ts`** — Fastify route definitions.

9. **`src/realtime/gateway.ts`** — Socket.io server with auth middleware.

10. **`src/realtime/sessionManager.ts`** — In-memory session state.

11. **`src/realtime/handlers/session.handler.ts`** — Join/leave/rejoin.

12. **`src/realtime/handlers/location.handler.ts`** — Location update + broadcast.

13. **`src/realtime/handlers/presence.handler.ts`** — Heartbeat.

14. **`src/app.ts`** — Fastify app setup, register routes and plugins.

15. **`src/server.ts`** — Entry point: create app, attach Socket.io, listen.

**Entry point (`src/server.ts`):**

```typescript
import { buildApp } from './app';
import { createSocketGateway } from './realtime/gateway';
import { env } from './config/env';

async function main() {
  const app = await buildApp();
  const io = createSocketGateway(app);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`Karavyn API running on port ${env.PORT}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## Step 4: Set Up Mobile (Expo)

```bash
cd apps/mobile

# Create Expo app with TypeScript template
npx create-expo-app@latest . --template blank-typescript

# Install core dependencies
npx expo install expo-location expo-notifications react-native-maps expo-router expo-linking
pnpm add socket.io-client zustand @tanstack/react-query @clerk/clerk-expo
pnpm add @karavyn/shared --workspace
```

**First files to create (in order):**

1. **`src/lib/clerk.ts`** — Clerk provider configuration.

2. **`src/lib/api.ts`** — API client with Clerk token injection (see frontend-patterns.md).

3. **`src/lib/socket.ts`** — Socket.io client singleton (see frontend-patterns.md).

4. **`src/lib/queryClient.ts`** — TanStack Query client.

5. **`src/app/_layout.tsx`** — Root layout with ClerkProvider, QueryClientProvider.

```typescript
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { queryClient } from '@/lib/queryClient';

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <Stack />
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

6. **`src/app/(auth)/sign-in.tsx`** — Clerk sign-in screen.

7. **`src/app/(tabs)/index.tsx`** — Home screen with session list.

8. **`src/features/session/hooks/useSessionList.ts`** — Fetch active sessions.

9. **`src/features/session/components/SessionCard.tsx`** — Session card for the list.

10. **`src/app/session/create.tsx`** — Session creation form.

11. **`src/app/session/[id]/index.tsx`** — Live session screen (map + members).

12. **`src/features/map/components/SessionMap.tsx`** — Google Maps with member markers.

13. **`src/features/map/components/MemberMarker.tsx`** — Custom member marker.

14. **`src/features/location/hooks/useLocationStream.ts`** — Location tracking + socket emission.

15. **`src/features/session/stores/sessionStore.ts`** — Zustand store for active session state.

---

## Step 5: Run Database Migrations

```bash
# From repo root:
pnpm db:generate   # Generate SQL migration from Drizzle schema
pnpm db:migrate    # Apply migration to Neon Postgres
```

Verify tables exist using Drizzle Studio:
```bash
pnpm db:studio
```

---

## Step 6: Wire the First Vertical Slice

The goal is the **minimum end-to-end path**:

```
Sign in → Create session → Get invite link → Join on second device → See each other on map
```

### Sequence

1. **Sign in** — Clerk handles the full flow. After sign-in, the Clerk webhook fires, creating a user record in Postgres.

2. **Create session** — Home screen → "Start Session" → Enter name, pick mode → POST /api/sessions → Returns session with invite code → Navigate to live session screen.

3. **Share invite link** — Session screen shows invite code and share button → Deep link: `karavyn.app/join/ABC123`.

4. **Join session** — Second device taps link → App opens → POST /api/sessions/join → Navigate to live session screen → Connect to Socket.io → Server adds to room → First user sees "member joined."

5. **See each other on map** — Both devices start location streaming → Emit `location:update` → Server broadcasts → Both devices render the other's marker on the map.

### What "Done" Looks Like

- Two real devices (or simulators) are in the same session
- Both show a Google Map with the other user's marker
- Moving one device updates the marker on the other device within ~5 seconds
- Closing and reopening the app auto-reconnects and restores state
- The host can end the session, and both devices return to the home screen

---

## Step 7: Add Coordination Features

Once the vertical slice works, layer on features in this order:

1. **Presence** — Heartbeat + "last seen" indicators on markers
2. **Status updates** — On My Way / Here / Running Late selector
3. **Quick pings** — Regroup / Moving / Need Help buttons
4. **Destination pinning** — Search for a place, pin it, show on map
5. **Roles** — Host can promote mods, permission checks on actions
6. **Push notifications** — Notify members of key events when backgrounded
7. **Session history** — View past sessions after they end

---

## Environment Setup Checklist

Before writing any code, set up these external services:

| Service | Action | You Get |
|---|---|---|
| **Clerk** | Create account → Create application → Get publishable + secret keys | Auth |
| **Neon** | Create account → Create project → Get connection string | Database |
| **Google Cloud Console** | Create project → Enable Maps SDK + Places API → Get API key → Restrict to app bundle IDs | Maps |
| **Railway** (when ready to deploy) | Create account → New project → Deploy from GitHub | Hosting |
| **Expo** (EAS) | `eas login` → `eas build:configure` | Build service |

Create `.env.local` files in both `apps/api/` and `apps/mobile/` with the keys from above.

---

## First Week Goals

| Day | Goal | Deliverable |
|---|---|---|
| 1 | Monorepo scaffold, shared package, basic tsconfigs | `pnpm dev` runs without errors in all packages |
| 2 | Clerk auth on mobile (sign-in screen) + API middleware | Can sign in on mobile, API rejects unauthenticated requests |
| 3 | User table, Clerk webhook sync, user profile screen | User record in Postgres after sign-in |
| 4 | Session CRUD API + session list screen | Can create a session, see it in the list |
| 5 | Invite code + join API + deep link handling | Second device can join via invite link |
| 6 | Socket.io gateway + session rooms + presence | Both devices connected to the same room, see join/leave events |
| 7 | Location streaming + map rendering | Both devices see each other's markers on the map |

After day 7, you have the product's core experience working. Everything else is layered on top.
