# ADR-005: Authentication

> **Status:** Accepted
> **Date:** March 2026
> **Decision:** Clerk

---

## Context

Karavyn needs:
- User authentication (sign up, sign in, sign out)
- Social login (Google, Apple — table stakes for mobile apps)
- JWT-based API authentication (mobile sends token, Fastify verifies)
- User profile management (name, avatar, email)
- Webhook-based user sync to the application database (Postgres)
- Minimal development time (solo founder)

## Decision

Use **Clerk** for all authentication and user management.

## Rationale

- **Best React Native auth SDK.** `@clerk/clerk-expo` provides pre-built `<SignIn />`, `<SignUp />`, and `<UserProfile />` components that work on mobile. This saves weeks of building auth screens manually.
- **Social login out of the box.** Google and Apple sign-in require zero custom OAuth implementation. Configure in Clerk dashboard, add the provider to the component, done.
- **JWT-based.** Clerk issues standard JWTs that Fastify middleware can verify using Clerk's public keys. No session cookies, no server-side session storage.
- **Webhooks for user sync.** Clerk fires `user.created` and `user.updated` webhooks. The Fastify server receives these and upserts user records into Postgres. The application database always has a local copy of user data.
- **10,000 MAU free tier.** Sufficient for MVP development, testing, and early production with real users.
- **Security handled.** Password hashing, token rotation, brute-force protection, MFA (if needed later) — all managed by Clerk. A solo founder should not be building security-critical auth infrastructure.

## Consequences

- **Positive:** Auth is fully functional in ~1-2 days of integration work. Pre-built UI components eliminate 90% of auth screen development.
- **Positive:** Clerk handles Apple's mandatory "Sign in with Apple" requirement for apps that offer social login.
- **Negative:** Vendor dependency. If Clerk changes pricing, has an outage, or shuts down, auth is broken. Mitigated by: Clerk is well-funded and widely adopted; JWT-based auth means migration to another provider is feasible (re-issue tokens, migrate user records).
- **Negative:** User data lives in two places (Clerk and Postgres). The webhook sync must be reliable. If a webhook is missed, the user exists in Clerk but not in Postgres. Mitigated by: implement a fallback "sync on first API request" check.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Supabase Auth** | Functional, but React Native SDK requires more custom UI work. No pre-built sign-in/sign-up components. RLS integration is nice but not needed since we have server-side permission checks. |
| **Firebase Auth** | Good SDK, but no pre-built React Native UI components. Pulls toward Firebase ecosystem (Firestore, Cloud Functions) which isn't the chosen stack. |
| **Auth.js (NextAuth)** | Designed for web/Next.js. Poor React Native support. Not appropriate for a mobile-first product. |
| **Custom JWT auth** | Weeks of security-critical development: password hashing (argon2/bcrypt), OAuth2 flows for Google/Apple, token issuance, token rotation, rate limiting, brute force protection. Unacceptable risk and time investment for a solo founder. |
