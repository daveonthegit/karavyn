# Karavyn — Canonical Feature Breakdown

> **Version:** 1.0
> **Last updated:** March 2026

---

## Feature Phases Overview

| Phase | Focus | Timeline |
|---|---|---|
| **MVP (v1.0)** | Core session loop: create, join, see each other, coordinate, end | Weeks 1-12 |
| **Phase 2 (v1.x)** | Retention and polish: templates, replay, notifications, multi-stop | Months 4-6 |
| **Phase 3 (v2.0)** | Growth and monetization: organizer tools, voice, partnerships, premium | Months 6-12+ |

---

## MVP Features (v1.0)

### P0 — Must Ship (product does not work without these)

| Feature | Effort | Description |
|---|---|---|
| **Auth (sign up / sign in)** | M | Clerk-powered. Google, Apple, email/password. JWT for API auth. |
| **Session creation** | M | Create session with name, description, mode (Drive/Walk/Hang). Returns invite code + deep link. |
| **Invite link + QR code** | S | Shareable link that deep-links into the app (or app store if not installed). QR code generation. |
| **Join session via deep link** | M | Tap link → open app → land in session. Handle app-not-installed redirect to store. |
| **Live group map** | L | Google Maps view showing all session members as real-time markers. Member name + status on marker. |
| **Real-time location streaming** | XL | Mobile collects location → emits to server via Socket.io → server broadcasts to session room → all members see updates. Session-scoped: starts on join, stops on leave/end. |
| **Session modes (Drive / Walk / Hang)** | M | Affects location update frequency, UI layout, and available interactions. Drive: 3-5s updates, large-tap UI. Walk: 10-15s. Hang: 30s or geofence. |
| **Roles: Host / Mod / Member** | M | Host = session creator (full control). Mod = promoted by host (can pin, broadcast). Member = default (view + personal status). |
| **Session end** | S | Host ends session. All location sharing stops. Session archived for history. |
| **Presence system** | M | Heartbeat-based. States: active / idle / disconnected. "Last seen" timestamps. |
| **Reconnection handling** | L | Auto-reconnect on network recovery. Rejoin session room. Sync missed state (membership changes, destination updates). |

### P1 — Should Ship (high value, complete the experience)

| Feature | Effort | Description |
|---|---|---|
| **Pin destination** | M | Host/mod pins a location visible to all members. Tap to open in Google/Apple Maps for navigation. |
| **Status updates** | S | Per-member status: On My Way / Here / Running Late. Visible on map marker and member list. |
| **Quick pings** | S | Preset broadcast messages: Regroup / Moving / Need Help / Stopping. No typing. Fire-and-forget. |
| **Push notifications** | M | Session started, destination changed, regroup ping, member arrived. Via Expo Notifications. |
| **Member list** | S | Scrollable list of session members with role, status, and last-seen time. Accessible from session screen. |
| **Session history** | M | Post-session summary: who participated, duration, mode. Stored for the user's session list. |
| **User profile (basic)** | S | Name, avatar. Set during onboarding. Displayed on map markers and member list. |

---

## Phase 2 Features (v1.x)

| Feature | Priority | Effort | Description |
|---|---|---|---|
| **Session templates** | P1 | M | Save a session config (name, mode, destinations) as a reusable template. Hosts can "run this route again." |
| **Multi-stop agenda** | P1 | L | Ordered list of destinations/waypoints. "Next stop" progression visible to all members. |
| **Session replay / timeline** | P2 | L | Post-session view showing the group's movement over time. Map playback + key events (joins, pings, destination changes). |
| **Notification preferences** | P1 | S | Per-user control: which push notifications to receive, quiet hours. |
| **Advanced moderation** | P2 | M | Mute member, block/report, session-level privacy settings. |
| **Improved member markers** | P1 | M | Animated markers, directional indicators (showing heading in Drive mode), distance-to-destination labels. |
| **Session search and discovery** | P2 | M | Browse past sessions, search by name. Foundation for future public/discoverable sessions. |
| **App store launch polish** | P0 | L | Screenshots, listing copy, privacy policy, terms of service, accessibility audit. |

---

## Phase 3 Features (v2.0+)

| Feature | Priority | Effort | Description |
|---|---|---|---|
| **Voice rooms (foreground)** | P2 | XL | Live voice channels within a session. Push-to-talk or open mic. Foreground-only (no background voice). Requires WebRTC + STUN/TURN. |
| **Organizer dashboard** | P1 | L | Analytics for hosts: attendance quality, session engagement, member retention, popular routes/spots. |
| **Premium tier** | P1 | M | Larger session sizes, templates, organizer analytics, custom session branding. Stripe integration. |
| **Public / discoverable sessions** | P2 | L | Organizers can make sessions publicly discoverable. Browse nearby sessions. Community events. |
| **Venue partnerships** | P3 | M | "Suggested next stop" powered by partner venues. Promoted places within session context. |
| **Web app (viewer)** | P2 | L | Read-only web view of active sessions. For sharing a live session link to non-app users. |
| **Voice notes** | P2 | M | Record and send short audio clips within a session. Simpler than live voice, still hands-free. |
| **Proximity alerts** | P3 | L | "You're near [member]" notifications. Geo-fence based. Useful for festivals/large venues. |
| **Session media** | P3 | M | Share photos within a session. Post-session gallery. |
| **API / integrations** | P3 | L | Public API for event platforms to embed Karavyn's coordination layer. |

---

## Feature Dependency Graph

```
Auth
 └─→ User Profile
 └─→ Session CRUD
      └─→ Invite Link + QR
      └─→ Join via Deep Link
      └─→ Roles (Host / Mod / Member)
      └─→ Session Modes (Drive / Walk / Hang)
      └─→ Real-time Gateway (Socket.io)
           └─→ Presence System
           └─→ Location Streaming
           │    └─→ Live Group Map
           │    └─→ Member Markers
           └─→ Quick Pings
           └─→ Status Updates
           └─→ Pin Destination
           └─→ Push Notifications
      └─→ Session End / Archive
           └─→ Session History
                └─→ Session Replay (Phase 2)
      └─→ Session Templates (Phase 2)
      └─→ Multi-stop Agenda (Phase 2)
      └─→ Organizer Dashboard (Phase 3)
```

---

## Implementation Order (Recommended)

This order follows dependencies and delivers a testable vertical slice as early as possible.

### Sprint 1-2: Foundation
1. Monorepo scaffold (Turborepo + Expo + Fastify + shared package)
2. Clerk auth integration (mobile sign-in → API JWT verification → user DB record)
3. User profile (name, avatar)

### Sprint 3-4: Session Core
4. Session CRUD (create, join, list, end)
5. Invite link generation + deep link handling
6. Basic session detail screen (name, mode, member list)

### Sprint 5-6: Real-Time Foundation
7. Socket.io gateway (auth middleware, session rooms)
8. Presence system (heartbeat, timeout, "last seen")
9. Join/leave real-time events (member appears/disappears)

### Sprint 7-8: Location and Map
10. Location streaming pipeline (mobile → server → broadcast)
11. Live group map with member markers
12. Session modes affecting update rates

### Sprint 9-10: Coordination Features
13. Roles and permissions enforcement
14. Pin destination (set, change, navigate-to)
15. Status updates (On My Way / Here / Running Late)
16. Quick pings (Regroup / Moving / Need Help)

### Sprint 11-12: Polish and Ship
17. Push notifications (key session events)
18. Session history (post-session summary)
19. Reconnection hardening
20. QR code generation
21. UI polish, error states, loading states, empty states
22. Internal testing (TestFlight / internal track)

---

## Risk Flags by Feature

| Feature | Risk | Notes |
|---|---|---|
| **Background location (Drive mode)** | HIGH | iOS/Android kill background processes aggressively. Must use foreground service (Android) + significant-change API (iOS). App store review will scrutinize. |
| **Deep link handling** | MEDIUM | Cross-platform deep linking is fragile. Must handle: app installed, app not installed, iOS Universal Links, Android App Links. Test extensively on real devices. |
| **Real-time reconnection** | MEDIUM | Network transitions (WiFi → cellular), tunnels, crowded venues — all cause disconnects. Must handle gracefully with state reconciliation. |
| **Voice rooms (Phase 3)** | VERY HIGH | WebRTC + STUN/TURN is operationally complex and expensive. TURN relay costs scale with usage. Do not attempt before Phase 3. |
| **Map performance** | MEDIUM | 15-20+ animated markers with frequent updates can cause frame drops on mid-range Android. Requires early performance testing and marker rendering optimization. |
| **Push notification deliverability** | LOW-MEDIUM | Android OEMs (Xiaomi, Huawei, Samsung) aggressively kill background processes and delay push delivery. Not fully solvable. |
