# Karavyn — Engineering Conventions

> **Version:** 1.0
> **Last updated:** March 2026

---

## Naming Conventions

### Files and Directories

| Type | Convention | Example |
|---|---|---|
| Feature directories | lowercase, singular | `features/session/`, `modules/auth/` |
| Component files | PascalCase | `SessionCard.tsx`, `MemberMarker.tsx` |
| Hook files | camelCase, `use` prefix | `useSession.ts`, `useLocationStream.ts` |
| Service files | camelCase, `.service.ts` suffix | `sessions.service.ts` |
| Repository files | camelCase, `.repository.ts` suffix | `sessions.repository.ts` |
| Schema files | camelCase, `.schema.ts` suffix | `sessions.schema.ts` |
| Route files | camelCase, `.routes.ts` suffix | `sessions.routes.ts` |
| Handler files | camelCase, `.handler.ts` suffix | `location.handler.ts` |
| Utility files | camelCase | `geo.ts`, `formatTime.ts` |
| Type-only files | camelCase | `types.ts`, `navigation.ts` |
| Constants files | camelCase | `modes.ts`, `roles.ts` |
| Test files | same as source + `.test.ts` | `sessions.service.test.ts` |

### Code Identifiers

| Type | Convention | Example |
|---|---|---|
| Variables and functions | camelCase | `getSession`, `inviteCode`, `handleJoin` |
| React components | PascalCase | `SessionCard`, `MemberMarker` |
| TypeScript types and interfaces | PascalCase | `SessionState`, `MemberRole`, `CreateSessionInput` |
| Classes | PascalCase | `SessionManager`, `AppError` |
| Enums (Zod / constants) | camelCase schema, UPPER_SNAKE values | `sessionModeSchema`, `'drive' | 'walk' | 'hang'` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `CLERK_SECRET_KEY` |
| Database tables | snake_case, plural | `session_members`, `location_updates` |
| Database columns | snake_case | `invite_code`, `created_at`, `host_id` |
| URL routes | kebab-case | `/api/sessions`, `/api/sessions/join` |
| Socket events | colon-separated namespace | `location:update`, `session:join`, `member:left` |

---

## Folder Conventions

### Feature-Based Organization

Code is organized by product feature, not by technical layer. A feature directory contains everything related to that feature: components, hooks, services, and types.

**Do this:**
```
features/session/
  components/SessionCard.tsx
  hooks/useSession.ts
  stores/sessionStore.ts
  types.ts
```

**Not this:**
```
components/SessionCard.tsx
hooks/useSession.ts
stores/sessionStore.ts
types/session.ts
```

### Shared Code Placement

| Code | Where It Lives |
|---|---|
| UI components (design system) | `components/ui/` |
| Layout components | `components/layout/` |
| API client, socket client, query client | `lib/` |
| Global app state | `store/` |
| Design tokens | `theme/` |
| Shared between frontend and backend | `packages/shared/` |

### Co-location Rule

If a file is only used within one feature, it lives inside that feature's directory. If it's used by multiple features, it moves to a shared location (`components/ui/`, `lib/`, etc.).

---

## Import Conventions

### Path Aliases

Use the `@/` alias to import from the `src` root. Never use relative paths that go up more than one level.

**Do this:**
```typescript
import { useSession } from '@/features/session/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
```

**Not this:**
```typescript
import { useSession } from '../../../features/session/hooks/useSession';
```

### Import Order

```typescript
// 1. Node built-ins (if backend)
import { createServer } from 'http';

// 2. External packages
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// 3. Monorepo packages
import { createSessionSchema, type Session } from '@karavyn/shared';

// 4. Internal imports (aliased)
import { sessionsService } from '@/modules/sessions/sessions.service';
import { AppError } from '@/lib/errors';

// 5. Relative imports (same feature)
import { SessionCard } from './components/SessionCard';
```

Use ESLint's `import/order` rule to enforce this automatically.

---

## Testing Strategy

### What to Test (Priority Order)

1. **Session state management** (highest risk, highest value) — the `SessionManager` class, join/leave/rejoin logic, role transitions, state versioning
2. **Permission checks** — ensure role-based access control works correctly
3. **Socket event handlers** — validate payloads, ensure correct broadcast behavior
4. **Service layer business logic** — session creation, joining, ending
5. **Zod schemas** — ensure validation catches bad input

### What NOT to Test in MVP

- React component rendering (manual testing is sufficient for a solo founder)
- Database queries (integration tests are more valuable than unit tests for repositories)
- Socket.io transport behavior (Socket.io is well-tested; trust the library)

### Testing Tools

| Tool | Purpose |
|---|---|
| **Vitest** | Unit and integration tests. Fast, ESM-native, compatible with TypeScript. |
| **Supertest** | HTTP endpoint testing for Fastify routes. |
| **Manual device testing** | Real-device testing on TestFlight + Android internal track. Irreplaceable for location, maps, and real-time behavior. |

### Test File Location

Test files live next to the code they test:
```
modules/sessions/
  sessions.service.ts
  sessions.service.test.ts
```

### Running Tests

```bash
pnpm test              # Run all tests (Vitest)
pnpm test:watch        # Watch mode
pnpm test -- --filter api  # Run only API tests
```

---

## Environment Variable Structure

### File Naming

```
.env.local             # Local development (git-ignored)
.env.example           # Template with all required vars (committed)
.env.test              # Test environment overrides
```

### Variable Naming

```bash
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://...

# Auth (Clerk)
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Mobile (prefix required by Expo)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Push Notifications
EXPO_PUSH_ACCESS_TOKEN=...

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### Typed Configuration

Environment variables are validated with Zod at startup (see `config/env.ts` in backend patterns). If a required variable is missing, the server crashes immediately with a clear error rather than failing silently later.

---

## Feature Flag Conventions

Use PostHog feature flags for gradual rollout and experimentation.

```typescript
import { useFeatureFlag } from '@/lib/posthog';

function SessionScreen() {
  const showMultiStop = useFeatureFlag('multi-stop-agenda');
  // ...
}
```

**Naming:** `kebab-case` descriptive names: `multi-stop-agenda`, `voice-notes`, `session-replay`.

**Cleanup:** When a flag is fully rolled out, remove the flag check and the PostHog flag definition. Don't accumulate stale flags.

---

## Lint / Format / Typecheck

### Toolchain

| Tool | Purpose | Config |
|---|---|---|
| **ESLint** (flat config) | Linting + import order | Root `eslint.config.js` shared across all packages |
| **Prettier** | Formatting | Root `.prettierrc` |
| **TypeScript** | Type checking | Per-package `tsconfig.json` extending `packages/tsconfig/` |

### Rules

- **No `any`.** Use `unknown` and narrow with type guards.
- **No unused variables.** ESLint `no-unused-vars` is error, not warning.
- **Consistent imports.** `import/order` enforced by ESLint.
- **No console.log in production code.** Use the structured logger (Pino on backend). Mobile: use a debug-only logger that strips in production builds.

### Scripts

```json
{
  "scripts": {
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "turbo run typecheck"
  }
}
```

Run `lint`, `format:check`, and `typecheck` in CI on every push.

---

## Git Workflow

### Branching

**Trunk-based development on `main`.** Short-lived feature branches. No long-lived branches.

```
main (always deployable)
  └── feature/session-creation (lives 1-3 days, then merges)
  └── fix/reconnection-race-condition
  └── chore/update-dependencies
```

### Branch Naming

`{type}/{short-description}`

Types: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`

### Commits

**Conventional Commits** format:

```
feat: add session creation API
fix: handle reconnection race condition in presence manager
chore: update socket.io to v4.8
docs: add ADR for maps provider choice
refactor: extract location buffer into separate module
```

Enforce with `commitlint` and a `commit-msg` git hook (via `husky` or `lefthook`).

### Pull Requests

Even as a solo developer, use PRs for:
- Non-trivial changes (new features, architectural changes)
- Changes you want CI to validate before merging
- Changes you want to document the rationale for

PR template:
```markdown
## What
Brief description of the change.

## Why
Motivation and context.

## Testing
How this was tested (device, scenario).

## Screenshots
If UI changes, include before/after screenshots.
```

---

## Documenting Future Decisions

New architectural decisions should be documented as ADRs in `docs/planning/adr-NNN-*.md` following the existing format:

```markdown
# ADR-NNN: [Title]

> **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN
> **Date:** [Date]
> **Decision:** [One sentence]

## Context
[Why this decision was needed]

## Decision
[What was decided]

## Rationale
[Why this was the best option]

## Consequences
[Positive and negative implications]

## Alternatives Considered
[What else was evaluated and why it was rejected]
```

Number ADRs sequentially. Never delete an ADR — if a decision is reversed, mark it `Superseded by ADR-NNN` and create a new ADR explaining the change.
