# ADR-001: Mobile Stack

> **Status:** Accepted
> **Date:** March 2026
> **Decision:** Expo (React Native) with TypeScript

---

## Context

Karavyn is a mobile-first, real-time group coordination app. It requires:
- iOS and Android support
- Background location tracking (Drive mode)
- Push notifications
- Google Maps rendering with custom markers
- WebSocket connections for real-time updates
- Deep link handling for invite links
- App store distribution

The founder's primary expertise is TypeScript / JavaScript / React.

## Decision

Use **Expo (React Native)** with TypeScript as the mobile framework, using the managed workflow with EAS Build and EAS Update.

## Rationale

- **One codebase, two platforms.** A solo founder cannot maintain separate iOS and Android apps. React Native gives 95%+ code sharing.
- **Expo managed workflow** eliminates native build toolchain management. EAS Build handles iOS/Android compilation in the cloud. EAS Update enables OTA JavaScript updates without going through app store review.
- **TypeScript everywhere.** The backend is TypeScript (Fastify). Shared types via monorepo. One language across the entire stack eliminates context-switching.
- **Expo Router** provides file-based routing with deep linking support — critical for invite link handling.
- **Expo ecosystem** includes first-party libraries for location (`expo-location`), notifications (`expo-notifications`), and other native features that are well-tested and maintained.
- **`react-native-maps`** works with Expo and supports Google Maps natively.
- **Clerk has a first-party Expo SDK** (`@clerk/clerk-expo`) with pre-built auth components.

## Consequences

- **Positive:** Fastest path to a working cross-platform app. OTA updates mean fixes ship in minutes, not days. Managed builds save hours of native toolchain debugging.
- **Negative:** Some native modules may not be available in the managed workflow. If a native module is needed that Expo doesn't support, the options are: (1) use a config plugin, (2) create a development build, or (3) eject to bare workflow. Background location specifically requires a development build (not a standard Expo Go build).
- **Negative:** React Native performance is generally excellent but not native-level for heavy animations. Map rendering with 20+ animated markers needs performance testing early.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Flutter** | Requires learning Dart. Breaks full-stack TypeScript. Smaller library ecosystem for location/maps compared to React Native. |
| **Native (Swift + Kotlin)** | 2x the code, 2x the maintenance, 2x the debugging. Incompatible with solo-founder velocity. |
| **PWA** | No background location on iOS. Limited push notification support on iOS. No app store distribution. Disqualified for a location-heavy mobile product. |
| **React Native (bare, no Expo)** | More flexibility but significantly more native toolchain management. Expo's managed workflow is strictly better for a solo developer. |
