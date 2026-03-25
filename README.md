# Karavyn

Real-time group coordination app. One session. Everyone knows where the group is, where it's going, and what's happening.

## Stack

- **Mobile:** Expo (React Native) + TypeScript
- **Backend:** Fastify + TypeScript
- **Database:** PostgreSQL on Neon + Drizzle ORM
- **Auth:** Clerk
- **Real-time:** Socket.io
- **Monorepo:** Turborepo + pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

1. Clone the repo and install dependencies:

```bash
pnpm install
```

2. Create environment files from templates:

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

3. Fill in your API keys (Clerk, Neon database URL).

4. Run database migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

5. Start development:

```bash
pnpm dev:api     # Start the API server
pnpm dev:mobile  # Start Expo dev server
```

## Project Structure

```
├── apps/
│   ├── api/           # Fastify backend
│   └── mobile/        # Expo React Native app
├── packages/
│   ├── shared/        # Shared types, schemas, events
│   ├── tsconfig/      # Shared TypeScript configs
│   └── eslint-config/ # Shared ESLint config
└── docs/              # Product and engineering docs
```
