# Karavyn — Repository Structure

> **Version:** 1.0
> **Last updated:** March 2026

---

## Monorepo with Turborepo + pnpm Workspaces

Karavyn uses a monorepo. The mobile app, backend API, and shared types package live in one repository. This enables:
- Shared TypeScript types with zero publishing overhead
- Atomic changes across frontend and backend in one PR
- Unified CI pipeline (lint, typecheck, test everything together)
- Consistent tooling configuration (ESLint, Prettier, tsconfig)

---

## Full Directory Tree

```
karavyn/
│
├── apps/
│   ├── mobile/                           # Expo React Native app
│   │   ├── src/
│   │   │   ├── app/                      # Expo Router pages
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── sign-in.tsx
│   │   │   │   │   └── sign-up.tsx
│   │   │   │   ├── (tabs)/
│   │   │   │   │   ├── index.tsx         # Home: session list
│   │   │   │   │   ├── explore.tsx       # Future: discover sessions
│   │   │   │   │   └── profile.tsx       # User profile
│   │   │   │   ├── session/
│   │   │   │   │   ├── create.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── index.tsx     # Live session (map + coordination)
│   │   │   │   │   │   ├── members.tsx
│   │   │   │   │   │   └── settings.tsx
│   │   │   │   │   └── join/
│   │   │   │   │       └── [code].tsx    # Deep link target
│   │   │   │   ├── history/
│   │   │   │   │   └── [id].tsx
│   │   │   │   └── _layout.tsx
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── components/
│   │   │   │   │   └── hooks/
│   │   │   │   ├── session/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── stores/
│   │   │   │   │   └── types.ts
│   │   │   │   ├── map/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   └── utils/
│   │   │   │   ├── location/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── services/
│   │   │   │   │   └── types.ts
│   │   │   │   ├── presence/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   └── components/
│   │   │   │   └── notifications/
│   │   │   │       ├── hooks/
│   │   │   │       └── services/
│   │   │   │
│   │   │   ├── components/              # Shared UI (design system)
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   ├── Avatar.tsx
│   │   │   │   │   ├── BottomSheet.tsx
│   │   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   │   └── EmptyState.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── ScreenContainer.tsx
│   │   │   │       ├── Header.tsx
│   │   │   │       └── TabBar.tsx
│   │   │   │
│   │   │   ├── lib/                     # Core clients and utilities
│   │   │   │   ├── api.ts
│   │   │   │   ├── socket.ts
│   │   │   │   ├── queryClient.ts
│   │   │   │   └── clerk.ts
│   │   │   │
│   │   │   ├── store/                   # Global stores
│   │   │   │   └── appStore.ts
│   │   │   │
│   │   │   ├── theme/                   # Design tokens
│   │   │   │   ├── colors.ts
│   │   │   │   ├── typography.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── navigation.ts
│   │   │
│   │   ├── assets/                      # Images, fonts, icons
│   │   ├── app.json                     # Expo config
│   │   ├── babel.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                             # Fastify backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── auth.middleware.ts
│       │   │   ├── users/
│       │   │   │   ├── users.routes.ts
│       │   │   │   ├── users.service.ts
│       │   │   │   └── users.repository.ts
│       │   │   ├── sessions/
│       │   │   │   ├── sessions.routes.ts
│       │   │   │   ├── sessions.service.ts
│       │   │   │   ├── sessions.repository.ts
│       │   │   │   └── sessions.schema.ts
│       │   │   ├── presence/
│       │   │   │   ├── presence.service.ts
│       │   │   │   └── presence.manager.ts
│       │   │   ├── locations/
│       │   │   │   ├── locations.service.ts
│       │   │   │   ├── locations.repository.ts
│       │   │   │   └── locations.buffer.ts
│       │   │   └── notifications/
│       │   │       ├── notifications.service.ts
│       │   │       └── notifications.repository.ts
│       │   │
│       │   ├── realtime/
│       │   │   ├── gateway.ts
│       │   │   ├── sessionManager.ts
│       │   │   └── handlers/
│       │   │       ├── session.handler.ts
│       │   │       ├── location.handler.ts
│       │   │       ├── presence.handler.ts
│       │   │       ├── ping.handler.ts
│       │   │       └── destination.handler.ts
│       │   │
│       │   ├── lib/
│       │   │   ├── errors.ts
│       │   │   ├── logger.ts
│       │   │   ├── inviteCode.ts
│       │   │   └── permissions.ts
│       │   │
│       │   ├── db/
│       │   │   ├── client.ts
│       │   │   ├── schema.ts
│       │   │   └── migrate.ts
│       │   │
│       │   ├── config/
│       │   │   ├── env.ts
│       │   │   └── constants.ts
│       │   │
│       │   ├── jobs/
│       │   │   ├── sessionCleanup.ts
│       │   │   └── locationPurge.ts
│       │   │
│       │   ├── types/
│       │   │   └── fastify.d.ts
│       │   │
│       │   ├── app.ts
│       │   └── server.ts
│       │
│       ├── drizzle/                     # Generated migrations
│       │   └── 0000_initial.sql
│       ├── drizzle.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared/                          # Shared types, schemas, events
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   ├── events/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── eslint-config/                   # Shared ESLint config
│   │   ├── base.js
│   │   ├── react.js
│   │   └── package.json
│   │
│   └── tsconfig/                        # Shared TypeScript configs
│       ├── base.json
│       ├── react-native.json
│       ├── node.json
│       └── package.json
│
├── docs/                                # All documentation
│   ├── product/
│   ├── architecture/
│   ├── planning/
│   ├── brand/
│   └── patterns/
│
├── .github/
│   └── workflows/
│       └── ci.yml                       # Lint + typecheck + test
│
├── turbo.json                           # Turborepo pipeline config
├── pnpm-workspace.yaml                  # Workspace definition
├── package.json                         # Root package.json
├── .prettierrc                          # Prettier config
├── .gitignore
└── README.md
```

---

## Key Directory Explanations

### `apps/mobile/src/app/`

Expo Router file-based routing. Each file is a screen. Directory structure maps to URL paths. This is where route params, layouts, and navigation configuration live. Screens should be thin — they compose feature containers.

### `apps/mobile/src/features/`

Feature modules own all code for a product feature. `features/session/` contains everything session-related: components, hooks, stores, types. Features should be as independent as possible — a feature can depend on `lib/` and `components/ui/`, but should avoid importing from other features.

### `apps/mobile/src/components/`

The design system. UI components here are presentational and reusable. They know nothing about sessions, locations, or the domain. They take props and render UI.

### `apps/api/src/modules/`

Domain modules for the backend. Each module owns its routes, service, repository, and validation schemas. Modules can depend on each other's services (e.g., `sessions.service` calls `notifications.service`), but never on each other's repositories directly.

### `apps/api/src/realtime/`

All Socket.io code lives here. The gateway sets up the server and auth middleware. Handlers process specific event types. The session manager holds in-memory state. This separation keeps real-time concerns out of the REST modules.

### `packages/shared/`

The contract layer. Zod schemas, TypeScript types, Socket.io event interfaces, and constants shared between mobile and API. Both apps depend on this package via pnpm workspace resolution.

### `docs/`

All documentation. Not code. Organized by concern: product, architecture, planning, brand, patterns.

---

## Workspace Configuration

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Root `package.json` Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:mobile": "turbo run dev --filter=mobile",
    "dev:api": "turbo run dev --filter=api",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:generate": "pnpm --filter api drizzle-kit generate",
    "db:migrate": "pnpm --filter api drizzle-kit migrate",
    "db:studio": "pnpm --filter api drizzle-kit studio"
  }
}
```
