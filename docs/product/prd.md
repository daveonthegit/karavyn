# Karavyn — Product Requirements Document

> **Version:** 1.0
> **Last updated:** March 2026
> **Status:** Pre-development

---

## Product Vision

Karavyn is the real-time session layer for real-world groups. It replaces the fragmented stack of navigation apps, group chats, event links, and location sharing that people cobble together every time they try to move, meet, or gather as a group.

One app. One live session. Everyone knows where the group is, where it's going, and what's happening — whether you're driving in a convoy, walking to a bar, or hosting a house party.

---

## Problem Statement

Coordinating a group of people in the physical world is broken. Every time a group tries to move together, meet up, or gather, they bounce between 3-5 apps:

- **Navigation** (Google Maps, Waze) for directions — but these are individual tools with no group awareness
- **Messaging** (iMessage, WhatsApp, Discord) for "where are you?" spam — but chat has no spatial context
- **Event/RSVP tools** (Partiful, Eventbrite) for invites — but these stop working the moment the event starts
- **Location sharing** (Snap Map, Find My Friends, WhatsApp live location) for "who's nearby" — but these are passive, time-limited, and have no structure (no roles, no destination, no session state)

The result: people get lost, groups fragment, someone is always texting while driving, and the "plan" lives in 14 different threads.

### Evidence from research

- **Snap Map** has 400M+ MAU, proving "where are my people" is mainstream social behavior — but it provides no structured session, roles, or coordination tools.
- **Partiful** won Google's "Best App of 2024" for lightweight event coordination — but stops at the invite. Once the event starts, you're back in group chat.
- **NHTSA reports 3,275 distracted driving deaths in 2023** — any product that involves groups in cars must treat minimal-interaction design as a core safety requirement, not a feature.
- Users report unreliable trip-sharing in nav apps (Android Auto/CarPlay constraints, share links failing), meaning even basic "follow my ETA" breaks in real conditions.
- WhatsApp live location is time-limited and degrades in background — session-bounded sharing is the norm users already accept.

---

## Target Users and Personas

### Persona 1: Crew Lead (Car club / crew organizer)

**Who:** Runs weekly or monthly cruises, car meets, rally routes, caravans to shows.

**Behavior:** Currently creates a group chat, posts a Google Maps link, tells people to "follow me," and spends the entire drive answering "where are you" and "which exit." Loses 2-3 cars every cruise.

**Needs:** One link to start a session, designate leaders, pin the destination/route, keep the convoy intact with minimal driver interaction.

**Frequency:** Weekly to monthly.

### Persona 2: Campus Connector (College student)

**Who:** Plans "going out tonight" gatherings where people drift across venues, arrive at different times, and need "where is everyone" context.

**Behavior:** Sends 30 texts coordinating dorm → pregame → walk/rideshare → venue → afterparty. Half the group ends up at the wrong place.

**Needs:** A live session showing where the group is right now, who's on the way, and what the next move is.

**Frequency:** Weekly (weekends, campus events).

### Persona 3: Young Professional Social Host

**Who:** Hosts dinners, birthdays, house parties, weekend hangs. The "planner friend" in their group.

**Behavior:** Uses Partiful or a group chat to collect RSVPs, then switches to texting for day-of coordination. No visibility into who's actually coming vs. who said "maybe."

**Needs:** Fast session creation with a shareable link, live "who's on the way" / "who's here" status, and a pinned location everyone can navigate to.

**Frequency:** 2-4 times per month.

### Persona 4: Nightlife Navigator

**Who:** The friend who manages a group moving between bars, clubs, or venues.

**Behavior:** Drops a pin in the group chat, half the group follows, the other half goes somewhere else. Spends the night texting "we moved" and "come to [bar name]."

**Needs:** A shared "current spot" with ETA awareness, "regroup" signals, and venue changes that push to everyone automatically.

**Frequency:** Weekly (weekends).

### Persona 5: Event Organizer (Community builder)

**Who:** Runs recurring meetups, pop-ups, campus org events, promoter-led nights.

**Behavior:** Uses Eventbrite or Meetup for RSVPs and check-in, but has no live coordination tool once people arrive. Can't see who's actually there vs. who RSVPed.

**Needs:** Session-level visibility, attendance awareness, ability to broadcast updates ("we're moving to the back room," "afterparty at X").

**Frequency:** Monthly to weekly.

---

## Key Pain Points

| Pain Point | Who Feels It | Current Workaround | Why It Fails |
|---|---|---|---|
| **Fragmentation across apps** | Everyone | Bounce between Maps + Chat + RSVP tools + Snap Map | No single source of truth for "where is the group right now" |
| **People getting lost or left behind** | Crew Leads, Nightlife Navigators | Texting directions, dropping pins | Pins are static, people miss messages, groups split |
| **Unsafe communication while moving** | Drivers in convoys, walk groups | Voice calls, texting at red lights | Distracted driving kills 3,275 people/year (NHTSA) |
| **No shared live context** | Everyone | WhatsApp live location, Snap Map | Time-limited, no roles, no destination, no session state |
| **"Where are you" spam** | Everyone | Group chat | Creates noise, no spatial awareness, no convergence signal |
| **Events stop at the invite** | Hosts, Organizers | Partiful, Eventbrite, text blasts | No real-time coordination once the event begins |

---

## Primary Use Cases

1. **Convoy / Group Drive** — A leader starts a session, members join and follow on a live map with preset driving-safe pings.
2. **Road Trip** — Multi-stop session with agenda items (gas stop, lunch, destination), members see caravan positions.
3. **House Party / Gathering** — Host creates a session at a location, guests see "who's on the way" and "who's here."
4. **Bar Hop / Pub Crawl** — Session moves between venues, members track the group's current spot, latecomers catch up.
5. **Campus Meetup** — Quick session for "meet at the quad" or "we're at the library," dissolves when done.
6. **Festival / Concert** — Large venue session where friends track each other within the event area, regroup after splitting up.
7. **Group Travel** — Airport → hotel → activity, multi-day session with agenda transitions.
8. **Pop-up / Community Event** — Organizer runs a session with attendance awareness and live broadcast updates.

---

## User Stories

### Session Creation and Joining

- As a host, I can create a session in one tap and get a shareable link and QR code.
- As a member, I can join a session by tapping a link or scanning a QR code without creating an account first (or with minimal sign-up).
- As a host, I can set the session mode (Drive / Walk / Hang) which affects the UI and location update frequency.
- As a host, I can name the session and add a description.

### Live Map and Location

- As a member, I can see all other session members on a live map in real time.
- As a member, my location is shared only within the active session and stops when the session ends.
- As a member, I can see each member's name and status on their map marker.
- As a member in Drive mode, I see a simplified, glanceable UI optimized for safety.

### Destinations and Agenda

- As a host, I can pin a destination that all members can see and navigate to.
- As a host, I can change the destination and all members are notified.
- As a host, I can add multiple agenda items (waypoints) for multi-stop sessions.
- As a member, I can tap the pinned destination to open navigation in my preferred maps app.

### Roles and Permissions

- As a host, I am the creator of the session with full control.
- As a host, I can promote members to mod (co-host) status.
- As a mod, I can pin destinations, send broadcast pings, and manage members.
- As a member, I can view the map, see other members, and send personal status updates.
- As a host, I can remove a member from the session.

### Status Updates and Quick Actions

- As a member, I can set my status: On My Way / Here / Running Late.
- As a member, I can send preset quick pings: Regroup / Moving / Need Help / Stopping.
- As a host or mod, I can send broadcast alerts visible to all members.
- In Drive mode, all interactions are large-tap or preset — no typing required.

### Session Lifecycle

- As a host, I can end the session, which stops all location sharing.
- As a member, I can leave the session at any time.
- As a member, if I lose connection, I automatically rejoin when connectivity returns.
- As a member, I can see a basic history of the session after it ends (who was there, key events).

---

## MVP Scope

### In MVP (v1.0)

| Feature | Priority | Notes |
|---|---|---|
| Session creation (name, mode, description) | P0 | Core flow |
| Invite link + QR code generation | P0 | Primary growth mechanic |
| Join session via deep link | P0 | Must work from SMS, social, browser |
| Live group map with member markers | P0 | The product's core screen |
| Real-time location streaming (session-scoped) | P0 | Stops when session ends |
| Session modes: Drive / Walk / Hang | P0 | Affects update rate + UI |
| Roles: Host / Mod / Member | P0 | Host = creator, can promote mods |
| Pin destination (visible to all, navigable) | P1 | Single destination for MVP |
| Status updates: On My Way / Here / Running Late | P1 | Per-member status |
| Quick pings: Regroup / Moving / Need Help | P1 | Preset, no typing |
| Session end (stops sharing, archives) | P0 | Clean lifecycle |
| Basic session history (who joined, duration) | P1 | Post-session summary |
| Auth: sign up / sign in (Google, Apple, email) | P0 | Via Clerk |
| Push notifications for key events | P1 | Session started, destination changed, regroup |

### NOT in MVP

| Feature | Why Deferred |
|---|---|
| Voice / audio | WebRTC + TURN infrastructure too complex, too expensive, too many edge cases |
| Chat / messaging | Encourages distracted use in Drive mode, duplicates group chat |
| Session replay / timeline | High effort, low urgency — users want coordination, not memories (yet) |
| Organizer dashboard / analytics | No organizer user base yet to serve |
| Payments / ticketing | Premature monetization |
| Venue partnerships / promoted places | Requires business development, not code |
| Social features (following, profiles, feed) | Not coordination — avoid becoming a social network |
| Offline mode | Adds massive complexity, low ROI for real-time product |
| Web app | Mobile-first, mobile-only for MVP |
| Multi-stop agenda (ordered waypoints) | Single pinned destination is sufficient for MVP |
| Proximity alerts | Requires background processing and geo-fencing complexity |

---

## Core Differentiators

1. **Session-native, not chat-native.** Karavyn's primitive is a live session, not a message thread. This is the architectural difference that lets it coordinate groups in ways chat apps structurally cannot.

2. **Activity modes change the product.** Drive / Walk / Hang modes aren't cosmetic — they change update rates, UI complexity, interaction patterns, and safety constraints. No competitor adapts to the activity type.

3. **Session-scoped location sharing.** Location is shared only within an active session and stops automatically when it ends. This is more trustworthy than passive "share my location for 1 hour" patterns.

4. **Roles and group state as first-class primitives.** Host, mod, member. Destination pinning. Regroup signals. These are coordination tools, not chat features.

5. **Cross-activity generalization.** Not a convoy app. Not a party app. Not an event app. One session engine that works for any real-world group activity.

---

## Success Metrics

### North Star

**Weekly Active Sessions (WAS):** Number of sessions created per week with 2+ active members.

### Primary Metrics

| Metric | Target (3 months post-launch) | Why It Matters |
|---|---|---|
| Sessions created / week | 500+ | Product is being used |
| Avg members per session | 4+ | Groups, not solo use |
| Invite-to-join conversion | 40%+ | Shareable link is working as growth loop |
| Session completion rate | 70%+ | Sessions end naturally, not abandoned |
| D7 retention (session creators) | 30%+ | Hosts come back |
| D7 retention (session joiners) | 20%+ | Members come back independently |

### Secondary Metrics

- Time to first session (from install) — target < 3 minutes
- Avg session duration by mode (Drive: 30-90 min, Walk: 15-45 min, Hang: 1-4 hours)
- Quick action usage per session — validates the no-typing interaction model
- Push notification opt-in rate — target 70%+
- Crash-free session rate — target 99%+

---

## Risks and Assumptions

### Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **App store rejects background location** | High | Medium | Prepare detailed privacy disclosures, limit background location to Drive mode, justify with core-purpose argument |
| **Background location unreliable on iOS/Android** | High | High | Use foreground service (Android) + significant location changes (iOS), show "last seen" timestamps, degrade gracefully |
| **Privacy backlash** | High | Low | Session-only sharing, no post-session retention by default, prominent controls, transparent data practices |
| **Users don't create sessions (cold start)** | High | Medium | Optimize session creation to < 10 seconds, shareable link as primary distribution, target existing groups (car clubs, friend groups) |
| **Real-time feels laggy or broken** | High | Medium | Server-authoritative state, honest "last seen" indicators, adaptive update rates, robust reconnection |
| **Scope creep into social network** | Medium | Medium | Strict MVP boundaries, no feed, no following, no profiles beyond basics |
| **Solo founder velocity** | Medium | Medium | Managed services (Clerk, Neon, Railway), monorepo for code reuse, strict prioritization |

### Assumptions

- People will share their location within a session context (validated by WhatsApp live location, Snap Map adoption).
- The shareable link/QR pattern drives organic growth (validated by Partiful).
- Car culture communities (car clubs, cruise groups) are a strong beachhead market with high pain and willingness to adopt.
- Session-bounded sharing is a meaningful privacy improvement over always-on location sharing.
- A solo founder can ship a functional MVP in 10-12 weeks with the chosen stack.
- Mobile is the only platform that matters for MVP (no web app needed).
