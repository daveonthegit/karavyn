# ADR-003: Database

> **Status:** Accepted
> **Date:** March 2026
> **Decision:** PostgreSQL on Neon + Drizzle ORM

---

## Context

Karavyn needs to persist:
- User accounts (synced from Clerk)
- Sessions with metadata
- Session membership with roles
- Destinations
- Location update history (high-write, append-only)
- Session event logs
- Push notification tokens

The data model is inherently relational: sessions have members, members have roles, sessions have destinations and events.

## Decision

Use **PostgreSQL** hosted on **Neon** (serverless), with **Drizzle ORM** for type-safe queries and schema management.

## Rationale

### Why PostgreSQL

- **Relational data model.** Sessions, members, and roles have clear relationships that benefit from foreign keys, JOINs, and referential integrity. "Get all members of session X with their roles" is a natural SQL query.
- **Transactions.** Session operations (create session + add host as first member) must be atomic. Postgres ACID transactions guarantee this.
- **Indexing flexibility.** Composite indexes, partial indexes, and (future) GiST indexes for geospatial queries. Critical for query performance on location data.
- **PostGIS extension.** When proximity features ship (Phase 3), PostGIS enables efficient geospatial queries without a database migration.
- **Industry standard.** Massive community, extensive tooling, well-understood operational characteristics. Any future hire will know Postgres.

### Why Neon

- **Serverless.** Scales to zero when idle — no charges during development downtime. Wakes in ~200ms on first request.
- **Database branching.** Create isolated database copies for development and testing with one command. Invaluable for a solo developer iterating on schema changes.
- **Generous free tier.** 0.5 GB storage, 190 compute-hours/month. Sufficient for MVP development and early production.
- **Neon serverless driver** (`@neondatabase/serverless`) works over HTTP and WebSocket, compatible with serverless and edge environments.
- **Autoscaling.** On paid plans, compute scales automatically with load. No manual instance sizing.

### Why Drizzle ORM

- **Type-safe schema-first design.** Define tables in TypeScript, get inferred types automatically. No code generation step (unlike Prisma).
- **Lightweight runtime.** No query engine binary (Prisma ships a ~15MB engine). Drizzle compiles directly to SQL.
- **SQL-like API.** Drizzle's query builder closely mirrors SQL, making it easy to understand what query is actually running.
- **Native Neon driver support.** `drizzle-orm/neon-serverless` adapter works out of the box.
- **Excellent migration system.** `drizzle-kit` generates and applies SQL migrations from schema changes.

## Consequences

- **Positive:** Rock-solid data integrity. Type-safe queries catch errors at compile time. Neon eliminates database administration.
- **Negative:** Neon cold starts add ~200-500ms latency on the first request after idle. Mitigated by configuring autosuspend timeout (or keeping the compute warm on a paid plan).
- **Negative:** PostgreSQL is a single-region database by default. Multi-region requires read replicas (available on Neon's paid plans). Acceptable for MVP.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **MongoDB** | Document model is a poor fit for relational data. No JOINs — requires denormalization and manual consistency management for sessions/members/roles. |
| **Supabase (Postgres)** | Good product, but Karavyn doesn't use Supabase Auth or Realtime. Neon is a better pure-Postgres host for this use case (true serverless, database branching). |
| **PlanetScale** | MySQL-based. No foreign keys by design (Vitess). Less ecosystem for geospatial queries. PostgreSQL is a better fit for this data model. |
| **Firebase Firestore** | Document database with per-write pricing. High-frequency location updates would be prohibitively expensive (1.7M writes/day at moderate use vs. 20k/day free tier). |
| **Prisma (ORM)** | Heavy query engine binary (~15MB), slower cold starts, requires code generation step. Drizzle is lighter, faster, and more SQL-transparent. |
