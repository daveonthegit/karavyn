# Karavyn — Screen System Plan

> **Version:** 1.0
> **Last updated:** March 2026
> **Status:** Pre-implementation design
> **Audience:** Engineers building the mobile app

---

## 1. Screen Inventory

Every screen in the app, grouped by feature. No screen exists without a purpose.

### Auth (unauthenticated users only)

| Screen | Purpose | When It Appears |
|---|---|---|
| **Sign In** | Email/password or social login (Google, Apple) | App launch when unauthenticated, or redirected from protected route |
| **Sign Up** | Account creation with name, avatar | User taps "Create account" from sign-in |

### Onboarding (first launch after sign-up)

| Screen | Purpose | When It Appears |
|---|---|---|
| **Profile Setup** | Set display name and avatar (required for map markers) | Immediately after first sign-up, before any other screen |
| **Location Permission** | Request foreground location with context explanation | After profile setup, before home screen |
| **Notification Permission** | Request push notification permission with value prop | After location permission |

### Home (default authenticated state, no active session)

| Screen | Purpose | When It Appears |
|---|---|---|
| **Home** | Active sessions, pending invites, quick-create CTA, session history | Default tab when app opens (authenticated, no active session) |

### Session Lifecycle

| Screen | Purpose | When It Appears |
|---|---|---|
| **Create Session** | Name, mode, description, optional destination | User taps "Start Session" from home |
| **Invite Share** | Invite link, QR code, share-to-apps | Immediately after session creation; also accessible from active session |
| **Join Gate** | Session preview (name, mode, host, member count) with "Join" CTA | Deep link or invite code entry |
| **Live Session** | THE core screen — map, members, coordination | User is an active member of a session |
| **Session Ended** | Summary — duration, member count, key events | Host ends session, or user opens ended session from history |

### Map / Live Session (sub-views within live session)

| Screen / Component | Purpose | When It Appears |
|---|---|---|
| **Session Map** | Full-screen map with member markers, destination pin | Always visible during live session |
| **Session Panel (bottom sheet)** | Session info, member list, controls | Pull up from bottom of live session screen |
| **Member Detail** | Individual member — role, status, last seen, actions (kick/promote) | Tap a member in the list or on the map |
| **Destination Picker** | Search/pin a destination (Google Places) | Host/mod taps "Set Destination" |
| **Drive Mode Overlay** | Simplified, large-button UI for driving safety | Active session in Drive mode |

### Quick Actions / Communication

| Screen / Component | Purpose | When It Appears |
|---|---|---|
| **Quick Action Bar** | Status selector + ping buttons | Persistent bar at bottom of live session (above bottom sheet) |
| **Ping Toast** | Incoming ping notification overlay | A member sends a ping (Regroup, Moving, etc.) |

### Notifications

| Screen / Component | Purpose | When It Appears |
|---|---|---|
| **Push Notification (OS-level)** | Session started, destination changed, regroup, member arrived | App is backgrounded |
| **In-App Alert Banner** | Same events, shown as banner when app is foregrounded | App is foregrounded during session |

### Profile & Settings

| Screen | Purpose | When It Appears |
|---|---|---|
| **Profile** | View/edit name, avatar | Profile tab or settings |
| **Settings** | Notification preferences, location permissions, sign out | Profile tab → Settings |

### Session History

| Screen | Purpose | When It Appears |
|---|---|---|
| **History List** | Past sessions, sorted by date | Home tab scrolled past active sessions, or dedicated section |
| **History Detail** | Post-session summary — who participated, duration, mode, events | Tap a past session |

**Total unique screens: 18** (plus sub-components like bottom sheets, overlays, and toasts that live within screens rather than as standalone routes).

---

## 2. Primary User Flows

### Flow A: Create a Session

```
Home Screen
  │
  ├─ tap "Start Session" (FAB or prominent CTA)
  │
  ▼
Create Session (modal, slides up from bottom)
  │  ├── enter session name (required)
  │  ├── select mode: Drive / Walk / Hang (required, default: Hang)
  │  ├── add description (optional)
  │  └── tap "Start"
  │
  ▼
Invite Share Sheet (modal bottom sheet)
  │  ├── invite link (tap to copy)
  │  ├── QR code
  │  ├── share to Messages / WhatsApp / etc.
  │  └── tap "Done" or background-dismiss
  │
  ▼
Live Session Screen (map centered on user's location)
  │  user is now the HOST
  │  session is ACTIVE
```

**Key decisions:**
- Session creation is a modal, not a full navigation push — keeps the user close to the live session
- Invite share appears automatically after creation to drive immediate sharing
- No destination is required at creation (can be set later from live session)

---

### Flow B: Join a Session

#### Via Invite Link (primary path)

```
Tap invite link (SMS, WhatsApp, social, browser)
  │
  ├── Expo Router deep link: /session/join/[code]
  │
  ├── IF not authenticated:
  │     Sign In → then continue join flow
  │
  ▼
Join Gate Screen
  │  ├── session name, mode icon, host name
  │  ├── member count ("4 people in this session")
  │  ├── "Join Session" button
  │  └── if session ended: "This session has ended" with history link
  │
  ├── tap "Join Session"
  │
  ▼
Live Session Screen (map shows all members)
  │  user is now a MEMBER
  │  location sharing begins
```

#### Via QR Code

```
Home Screen → Tap QR scanner icon → Scan code → Join Gate Screen → (same as above)
```

#### Via Home Screen (active session card)

```
Home Screen → Tap active session card → Live Session Screen
```

---

### Flow C: Active Session Usage

```
Live Session Screen
  │
  │  ALWAYS VISIBLE:
  │  ├── map (full screen, members as markers)
  │  ├── session header (name, mode, member count)
  │  ├── quick action bar (bottom)
  │  └── bottom sheet handle (pull up for panel)
  │
  │  USER ACTIONS:
  │
  ├── Set status → tap status chip in quick action bar
  │     → selector: On My Way / Here / Running Late
  │     → status appears on user's map marker
  │
  ├── Send ping → tap ping button in quick action bar
  │     → Regroup / Moving / Need Help / Stopping
  │     → broadcasts to all members (toast appears for everyone)
  │
  ├── Set destination (host/mod) → pull up panel → "Set Destination"
  │     → Destination Picker (places search)
  │     → pin appears on map for all members
  │     → members tap pin → opens in Google/Apple Maps
  │
  ├── View members → pull up panel → member list
  │     → tap member → Member Detail (role, status, actions)
  │
  ├── Invite more people → pull up panel → "Invite" → Share Sheet
  │
  ├── Center on group → tap target icon → map fits all members
  │
  └── Center on self → tap location icon → map centers on user
```

---

### Flow D: Leaving / Ending a Session

#### Member leaves:

```
Live Session → pull up panel → "Leave Session"
  │
  ├── confirmation: "Leave [session name]? Your location will stop being shared."
  │
  ▼
Home Screen (session removed from active list)
```

#### Host ends session:

```
Live Session → pull up panel → "End Session"
  │
  ├── confirmation: "End [session name]? This stops location sharing for all members."
  │
  ▼
Session Ended Screen (summary)
  │  ├── duration, member count, mode
  │  ├── member list (who participated)
  │  └── "Done" → Home Screen
  │
  ▼ (simultaneously, for all other members)
  All members see: "Session ended by [host name]"
  → Session Ended Screen or push notification → Home Screen
```

---

### Flow E: Reconnecting to a Session

```
User's app is killed or loses connection
  │
  ├── Socket.io auto-reconnects in background
  │
  ├── On successful reconnect:
  │     → rejoin session room
  │     → receive full state sync (members, locations, destination)
  │     → map updates with current positions
  │     → no user action required
  │
  ├── If reconnect fails after timeout:
  │     → show banner: "Connection lost. Retrying..."
  │     → map shows stale markers with "last seen X ago"
  │     → manual retry button appears after 30s
  │
  ├── If session ended while disconnected:
  │     → on reconnect, receive "session ended" event
  │     → show Session Ended Screen
  │
  └── If user was removed while disconnected:
      → on reconnect, receive "removed from session" event
      → show toast: "You were removed from [session name]"
      → redirect to Home Screen
```

---

### Flow F: Receiving and Responding to Alerts

```
PING RECEIVED (e.g., "Regroup"):
  │
  ├── IF app is foregrounded:
  │     → Animated toast drops from top of live session screen
  │     → Shows: "[Member name]: Regroup" with ping icon
  │     → Auto-dismiss after 5 seconds, or tap to dismiss
  │     → Haptic feedback (medium impact)
  │
  └── IF app is backgrounded:
      → Push notification: "[Session name]: [Member name] says Regroup"
      → Tap notification → open app → Live Session Screen

DESTINATION CHANGED:
  │
  ├── IF foregrounded:
  │     → Banner: "New destination: [Place name]"
  │     → Map animates to show new pin
  │     → Tap banner → opens destination in Maps app
  │
  └── IF backgrounded:
      → Push: "[Session name]: New destination — [Place name]"
      → Tap → Live Session Screen with destination visible

MEMBER JOINED / LEFT:
  │
  └── Subtle toast at top: "[Name] joined" or "[Name] left"
      → Member markers update on map
      → Member list updates in panel
```

---

## 3. Core Screens — Detailed Breakdown

### A. Home Screen

**Route:** `(tabs)/index.tsx`

**Purpose:** The app's landing screen. Shows what's happening now and gives fast access to creating or joining sessions.

#### Layout Structure

```
┌─────────────────────────────────┐
│  Header: "Karavyn"    [QR scan] │
├─────────────────────────────────┤
│                                 │
│  ┌─ Active Sessions ──────────┐ │
│  │  SessionCard (live)        │ │
│  │  SessionCard (live)        │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Pending Invites ──────────┐ │
│  │  InviteCard (tap to join)  │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Recent Sessions ──────────┐ │
│  │  HistoryCard (ended)       │ │
│  │  HistoryCard (ended)       │ │
│  └────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│      [ Start Session ]  (FAB)   │
└─────────────────────────────────┘
     [Home]  [Profile]  ← Tab bar
```

#### Key UI Components

- **Session Card (active):** Session name, mode icon (car/walk/pin), member count with stacked avatars, "Live" badge with pulsing dot. Tap → Live Session Screen.
- **Invite Card:** Session name, host name, mode icon, "Join" button. Tap "Join" → Join Gate → Live Session.
- **History Card:** Session name, date, duration, member count. Muted styling vs active cards. Tap → History Detail.
- **FAB / Start Session button:** Bottom-right floating action button or fixed bottom CTA. The most prominent action on the screen.
- **QR Scanner icon:** Top-right header action. Opens camera scanner for invite QR codes.

#### States

| State | What Shows |
|---|---|
| **Loading** | Skeleton cards (shimmer placeholders) |
| **Empty (no sessions, new user)** | Illustration + "Start your first session" + prominent "Start Session" button + "Have an invite link? Tap it to join" |
| **Has active sessions** | Active session cards at top (sorted by most recent activity), history below |
| **Has pending invites** | Invite cards between active sessions and history, with subtle highlight/badge |
| **Error** | "Couldn't load sessions" + "Try again" button |

#### Edge Cases

- User has 5+ active sessions (rare but possible): scrollable list, no pagination needed for MVP
- User taps a session that ended between last fetch and now: show "This session has ended" inline, refetch list
- Deep link opens while user is on home screen: navigate directly to join gate

---

### B. Session Creation Flow

**Route:** `session/create.tsx` (presented as a modal)

**Purpose:** Create a new session in under 10 seconds. No friction, no unnecessary fields.

#### Layout Structure

```
┌─────────────────────────────────┐
│  ✕  Create Session              │
├─────────────────────────────────┤
│                                 │
│  Session Name                   │
│  ┌────────────────────────────┐ │
│  │  Friday Night Cruise       │ │
│  └────────────────────────────┘ │
│                                 │
│  Mode                           │
│  ┌────────┐┌────────┐┌───────┐ │
│  │ 🚗    ││ 🚶    ││ 📍   │ │
│  │ Drive  ││ Walk   ││ Hang  │ │
│  └────────┘└────────┘└───────┘ │
│     (segmented control / chips) │
│                                 │
│  Description (optional)         │
│  ┌────────────────────────────┐ │
│  │  Cruise to the waterfront  │ │
│  └────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  [ Start Session ]              │
└─────────────────────────────────┘
```

#### Key UI Components

- **Name input:** Single text field, auto-focused on open. Placeholder: "Friday Night Cruise" / "House Party" / "Bar Hop" (varies by selected mode).
- **Mode selector:** Three large tappable chips with icon + label. Visual differentiation: Drive (car icon, warm orange), Walk (walking icon, blue), Hang (pin icon, green). Default: Hang.
- **Description input:** Optional multiline text. Collapsed by default — tap "Add description" to expand. Keeps the form short for quick creation.
- **Start Session button:** Full-width, primary color, disabled until name is entered.

#### Mode Selection Feedback

When mode is selected, show a one-line descriptor below:
- **Drive:** "Optimized for driving. Large buttons, fast updates."
- **Walk:** "For groups moving on foot. Moderate updates."
- **Hang:** "For gathering at a spot. Low battery usage."

#### States

| State | What Shows |
|---|---|
| **Default** | Empty form, name input focused, Hang mode selected |
| **Submitting** | "Start Session" button shows spinner, inputs disabled |
| **Error** | Inline error below name field ("Session name is required") or toast for server errors |

#### Edge Cases

- User dismisses modal mid-creation: no session created, no state saved (intentional — creation should be fast enough to redo)
- Network error on submit: show toast "Couldn't create session. Check your connection." with retry

---

### C. Live Session Screen (THE CORE SCREEN)

**Route:** `session/[id]/index.tsx`

**Purpose:** The entire product in one screen. Every member of an active session lives here.

This is the screen that must be designed with the most care. It must work for a driver glancing at their phone in a mount, a person walking in a group, and someone at a house party checking who's on the way.

#### Layout Structure — Standard Mode (Walk / Hang)

```
┌─────────────────────────────────┐
│  ← Session Name     [invite] ⋮ │  ← Session Header (translucent overlay on map)
├─────────────────────────────────┤
│                                 │
│           MAP (full screen)     │
│                                 │
│     👤 Alex                     │
│          👤 Jordan              │
│                 📍 Destination  │
│     👤 Sam                      │
│                                 │
│  [📍]         [⊕]              │  ← Map controls (bottom-left: center on self, center on group)
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │ [On My Way ▾]  [Ping ▾] │   │  ← Quick Action Bar
│  └──────────────────────────┘   │
├╌╌╌╌╌╌ drag handle ╌╌╌╌╌╌╌╌╌╌╌╌┤
│  Session Panel (bottom sheet)   │  ← Collapsed: peek shows member avatars
│  ├── Members (4)                │     Pull up: full member list + controls
│  ├── Destination: Waterfront    │
│  ├── [Set Destination]          │
│  ├── [Invite]                   │
│  └── [Leave / End Session]      │
└─────────────────────────────────┘
```

#### Layout Structure — Drive Mode

```
┌─────────────────────────────────┐
│  Friday Night Cruise  ● DRIVE   │  ← Compact header, mode badge
├─────────────────────────────────┤
│                                 │
│           MAP (full screen)     │
│                                 │
│     member markers visible      │
│     destination pin visible     │
│                                 │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │  [ REGROUP ]  [ HELP ]   │   │  ← LARGE tap targets (72pt+ height)
│  │                          │   │
│  │  [  STOPPING  ]          │   │
│  │                          │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
   NO bottom sheet in drive mode
   NO text input
   NO small buttons
```

**Drive mode constraints:**
- Minimum touch target: 72x72 dp (larger than standard 48dp)
- No scrollable lists visible
- No text input of any kind
- Maximum 3 actions visible at once
- High-contrast text on map overlay
- Bottom sheet is disabled (no pull-up panel)
- Member list accessed only via header tap (full screen overlay, not for use while driving)

#### Map Layer Details

**Member markers:**
- Circular avatar (32dp) with colored border indicating status:
  - Green border: Here
  - Blue border: On My Way
  - Orange border: Running Late
  - Gray border: No status set
  - Dim/translucent: Disconnected (stale >60s)
- Name label below avatar (12sp, truncated at 10 chars)
- Current user's marker has a subtle glow/pulse to distinguish self
- Heading indicator: small directional arrow on marker edge (Drive mode only, when speed > 2 m/s)

**Destination pin:**
- Distinct from member markers — use standard map pin (red) with destination name label
- Tap → callout with name + "Navigate" button → opens Google Maps / Apple Maps

**Map controls (floating buttons, bottom-left):**
- **Center on self:** Crosshair/location icon. Tap → animate map to user's position.
- **Center on group:** Group/target icon. Tap → fit all member markers in view with padding.

**Map behavior:**
- Auto-centers on the group initially when entering session
- Does NOT auto-follow any member (user controls the map)
- When user hasn't interacted with map for 30s, gently re-centers on group
- Pinch zoom, pan, rotate all enabled
- Map style: standard (not satellite) with reduced POI density for cleaner visual

#### Quick Action Bar

Persistent bar between the map and the bottom sheet. Two primary controls:

**Status selector (left):**
```
┌──────────────────┐
│  On My Way  ▾    │  ← Tappable chip, shows current status
└──────────────────┘
```
Tap → popup with three options:
- On My Way (blue)
- Here (green)
- Running Late (orange)
- Clear status (gray, dismisses)

Selection is instant (optimistic update + socket emit). No confirmation needed.

**Ping button (right):**
```
┌──────────────────┐
│   Ping  ▾        │  ← Tappable chip
└──────────────────┘
```
Tap → popup with ping options:
- Regroup (all modes)
- Moving (all modes)
- Need Help (all modes)
- Stopping (Drive mode only)

Sending a ping: optimistic, fire-and-forget. Brief haptic + visual confirmation ("Regroup sent"). All members see a toast. Cooldown: 10 seconds between pings to prevent spam.

#### Real-Time State Updates

| Event | Visual Response |
|---|---|
| Member location update | Marker animates smoothly to new position (interpolated, not jumped) |
| Member joins | New marker appears with brief scale-in animation; toast "Alex joined" |
| Member leaves | Marker fades out with brief animation; toast "Alex left" |
| Member status change | Marker border color transitions; status text updates |
| Member disconnects | Marker dims after 60s of no updates; shows "last seen Xm ago" on tap |
| Destination set/changed | Pin appears/moves on map with drop animation; banner notification |
| Ping received | Toast drops from top with ping type + sender name; haptic feedback |
| Session ended | Modal overlay: "Session ended by [host]" → Session Ended screen |

#### States

| State | What Shows |
|---|---|
| **Loading** | Map loads first (Google Maps tiles), then member markers populate |
| **Connecting** | Map visible, banner: "Connecting..." (Socket.io handshake in progress) |
| **Connected, members visible** | Normal state — all features active |
| **Disconnected** | Banner: "Connection lost. Retrying..." Map still shows last-known positions. Quick actions disabled. |
| **Reconnecting** | Banner: "Reconnecting..." with progress indicator |
| **Reconnected** | Banner briefly shows "Connected" (green), then auto-dismisses |
| **Location permission denied** | Banner: "Location sharing is off. Tap to enable." → opens app settings |
| **Solo session (only member)** | Map shows only user's marker. Prompt: "Share the invite to bring people in." |

#### Edge Cases

- User is in a session with 20+ members: markers may overlap. Solution: at low zoom levels, cluster nearby markers with a count badge. At high zoom, show individuals.
- Very fast movement (highway): marker updates every 3-5s in Drive mode. Use animation interpolation to smooth movement between updates.
- Member at same location as destination: marker and pin overlap. Destination pin always renders above member markers.
- Battery saver mode on device: location updates may be less frequent. Show "Low accuracy" indicator on user's own marker if accuracy degrades past 50m.

---

### D. Session Panel (Bottom Sheet)

**Presented as:** A bottom sheet within the Live Session screen. Three snap points:
1. **Peek** (default): Just the drag handle + session name + member avatar row. ~80dp visible.
2. **Half**: Member list + destination + primary actions. ~50% of screen.
3. **Full**: Complete session controls, scrollable.

#### Layout (Half-Open State)

```
┌─────────────────────────────────┐
│  ─── (drag handle) ───          │
├─────────────────────────────────┤
│  Members (4)                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │Alex│ │Sam │ │Jo  │ │Mia │   │
│  │Host│ │Mod │ │    │ │    │   │
│  │Here│ │OMW │ │Late│ │ -- │   │
│  └────┘ └────┘ └────┘ └────┘   │
│                                 │
│  Destination                    │
│  📍 The Waterfront Bar          │
│     [Navigate]  [Change]        │
│                                 │
│  ┌────────────────────────────┐ │
│  │  [Invite People]           │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │  [Leave Session]           │ │  ← "End Session" if user is host
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Member List Items

Each member row shows:
- Avatar (32dp)
- Display name
- Role badge (Host / Mod) — only if host or mod
- Status text (On My Way / Here / Running Late) — colored
- Presence indicator: green dot (active), yellow (idle), red (disconnected)

Tap member → Member Detail (modal or expanded inline):
- Full status info
- "Last seen" timestamp if disconnected
- Actions (host/mod only): Promote to Mod / Demote / Remove from Session

#### Destination Section

- Shows current destination name and address
- **Navigate** button: opens destination in device's default maps app
- **Change** button (host/mod only): opens Destination Picker
- If no destination: shows "No destination set" + "Set Destination" (host/mod only)

---

### E. Messaging / Communication

**MVP has NO chat.** This is a deliberate decision — chat encourages typing while moving, which is dangerous in Drive mode and counter to the app's safety principles.

All communication happens through:

1. **Status updates** — declarative, one-tap (On My Way / Here / Running Late)
2. **Quick pings** — preset, one-tap broadcast messages (Regroup / Moving / Need Help / Stopping)
3. **Destination changes** — automatically notified to all members

This model is:
- **Safe:** No typing required. All interactions are single-tap.
- **Fast:** Status and pings are communicated in under 1 second.
- **Unambiguous:** Preset messages have clear, shared meanings. No misinterpretation.

#### Communication Hierarchy

| Method | Who Can Send | Visibility | When to Use |
|---|---|---|---|
| Status update | Any member | Visible on map marker + member list | "I'm on my way" / "I'm here" |
| Quick ping | Any member | Toast for all session members + push notification | "Regroup" / "Need help" |
| Destination change | Host / Mod | Banner for all members + push notification | Group is moving to a new spot |

---

### F. Notifications / Alerts

#### Push Notification Types (MVP)

| Event | Title | Body | Priority | Tap Action |
|---|---|---|---|---|
| Session started | "[Host] started a session" | "[Session name] — tap to join" | High | Open Join Gate |
| Regroup ping | "[Session name]" | "[Member] says: Regroup" | High | Open Live Session |
| Need Help ping | "[Session name]" | "[Member] needs help!" | Critical | Open Live Session |
| Destination changed | "[Session name]" | "New destination: [Place name]" | Normal | Open Live Session |
| Member arrived | "[Session name]" | "[Member] is here" | Low | Open Live Session |
| Session ended | "[Session name]" | "Session ended by [Host]" | Normal | Open Session Ended |

#### In-App Alert Banners

When the app is foregrounded during a session, alerts appear as:

```
┌─────────────────────────────────┐
│  🔄 Jordan: Regroup             │  ← Slides down from top
│  2 seconds ago                  │  ← Auto-dismiss after 5s
└─────────────────────────────────┘
```

- Background color varies by ping type: Regroup (amber), Need Help (red), Moving (blue), Stopping (gray)
- Haptic feedback accompanies each alert
- Tapping the banner does nothing extra (user is already in the session)
- Multiple rapid alerts stack briefly, then collapse to "X new alerts"

---

### G. Profile / Settings

**Route:** `(tabs)/profile.tsx`

Minimal for MVP. This is not a social profile — it's functional identity for map markers and member lists.

#### Profile Screen

```
┌─────────────────────────────────┐
│  Profile                        │
├─────────────────────────────────┤
│         ┌──────┐                │
│         │avatar│                │
│         └──────┘                │
│         Alex Johnson            │
│         alex@email.com          │
│                                 │
│  [Edit Profile]                 │
│                                 │
│  ────────────────────────       │
│                                 │
│  Settings                       │
│  > Notifications                │
│  > Location Permissions         │
│  > About Karavyn                │
│  > Sign Out                     │
│                                 │
└─────────────────────────────────┘
```

#### Settings → Notifications

- Toggle: Session invites
- Toggle: Pings (Regroup, Need Help, etc.)
- Toggle: Member arrived
- Toggle: Destination changes

#### Settings → Location

- Current permission status (granted / denied / not asked)
- Link to system settings if denied
- Explanation of how location is used (session-scoped only)

---

## 4. Navigation System

### Navigation Architecture

```
Root (_layout.tsx)
├── (auth)/                    ← Stack navigator (unauthenticated)
│   ├── sign-in
│   └── sign-up
│
├── (tabs)/                    ← Tab navigator (authenticated, bottom tab bar)
│   ├── index (Home)
│   └── profile (Profile)
│
├── session/
│   ├── create               ← Modal (slides up, presentationStyle: "modal")
│   ├── [id]/
│   │   ├── index            ← Full screen (Live Session) — hides tab bar
│   │   ├── members          ← Modal (member list detail)
│   │   └── settings         ← Modal (session settings, host only)
│   └── join/[code]          ← Full screen (Join Gate) — deep link target
│
├── history/
│   └── [id]                 ← Push (Session History Detail)
│
└── onboarding/              ← Stack (first launch only)
    ├── profile-setup
    ├── location-permission
    └── notification-permission
```

### Navigation Type Decisions

| Screen | Presentation | Why |
|---|---|---|
| Home / Profile | **Bottom tabs** | Standard mobile pattern for top-level sections. Only 2 tabs for MVP (Home + Profile). A third tab slot is reserved for future "Explore" / discovery. |
| Session Create | **Modal (bottom slide-up)** | Quick creation flow. User stays mentally "on" the home screen. Easy to dismiss. |
| Live Session | **Full screen (stack push, tab bar hidden)** | The map needs maximum screen real estate. Tab bar would waste space and compete with the quick action bar. |
| Join Gate | **Full screen (stack push)** | Focused single-action screen. Deep link lands here directly. |
| Invite Share Sheet | **Bottom sheet** | Quick action after session creation or during session. Not a full screen. |
| Session Panel | **Bottom sheet (within live session)** | Always accessible, never leaves the map context. Three snap points. |
| Member Detail | **Bottom sheet or modal** | Contextual, quick, dismissable. |
| Destination Picker | **Modal (full screen)** | Needs search input + results list + map preview. Too much content for a bottom sheet. |
| Settings | **Stack push** | Standard drill-down from profile tab. |
| Onboarding | **Stack navigator** | Linear, sequential flow. No back-tracking needed. |

### Tab Bar Design

Two tabs for MVP:

```
┌──────────────┬──────────────┐
│     Home     │   Profile    │
│      🏠      │      👤     │
└──────────────┴──────────────┘
```

- Tab bar is hidden during Live Session (map needs full screen)
- Tab bar uses standard safe area insets
- Active tab: filled icon + primary color label
- Inactive tab: outline icon + gray label
- Badge on Home tab: count of pending invites (if any)

### When to Use Each Pattern

| Pattern | Use For |
|---|---|
| **Full screen push** | Primary content screens (live session, join gate, history detail) |
| **Modal** | Creation flows, destination picker, member detail — things the user does temporarily and returns from |
| **Bottom sheet** | Session panel, invite share, quick selectors — things that overlay the current context without leaving it |
| **Toast / Banner** | Transient notifications (pings, member join/leave, connection status) — appear and auto-dismiss |

---

## 5. App States & Modes

### State Machine

```
                    ┌────────────┐
                    │   SIGNED   │
         ┌─────────│    OUT     │
         │          └─────┬──────┘
         │                │ sign in
    sign out              ▼
         │          ┌────────────┐
         │          │    HOME    │──── view history
         └──────────│ (no active │──── view profile
                    │  session)  │
                    └──┬─────┬───┘
                       │     │
              create   │     │  accept invite /
              session  │     │  deep link join
                       ▼     ▼
                    ┌────────────┐
                    │  JOINING   │  ← Join Gate screen
                    │  (preview) │
                    └─────┬──────┘
                          │ confirm join
                          ▼
                    ┌────────────┐
                    │   ACTIVE   │  ← Live Session screen
                ┌───│  SESSION   │───┐
                │   └──┬──────┬──┘   │
          disconnected │      │      │ removed by host
                │      │      │      │
                ▼      │      │      ▼
        ┌────────────┐ │      │  ┌────────┐
        │RECONNECTING│ │      │  │ KICKED │──→ HOME
        │  (banner)  │ │      │  └────────┘
        └─────┬──────┘ │      │
              │        │      │
          reconnect    │ leave │ host ends
              │        │      │
              ▼        ▼      ▼
        ┌────────┐  ┌────────────┐
        │ ACTIVE │  │  SESSION   │
        │SESSION │  │  ENDED     │──→ HOME
        └────────┘  └────────────┘
```

### What the UI Shows in Each State

| State | Screen | Header | Map | Quick Actions | Bottom Sheet |
|---|---|---|---|---|---|
| **Signed Out** | Sign In | n/a | n/a | n/a | n/a |
| **Home (no session)** | Home | "Karavyn" | n/a | n/a | n/a |
| **Joining** | Join Gate | Session name | n/a | n/a | n/a |
| **Active Session** | Live Session | Session name + mode | Full, live markers | Enabled | Available |
| **Active — Disconnected** | Live Session | Session name + ⚠️ | Stale markers (dimmed) | Disabled (grayed out) | Available (cached data) |
| **Active — Reconnecting** | Live Session | "Reconnecting..." | Stale markers | Disabled | Available (cached data) |
| **Session Ended** | Session Ended | "[Session] ended" | n/a | n/a | n/a |
| **Kicked** | Toast → Home | n/a | n/a | n/a | n/a |

### Mode-Specific UI Differences

| UI Element | Drive | Walk | Hang |
|---|---|---|---|
| Quick action buttons | 72dp+ height, 3 max visible | Standard 48dp, all visible | Standard 48dp, all visible |
| Bottom sheet | Disabled | Enabled | Enabled |
| Text input | None anywhere | None (MVP) | None (MVP) |
| Member list | Accessible via header only | In bottom sheet | In bottom sheet |
| Map auto-recenter | Every 30s | Every 30s | Disabled (user controls) |
| Heading arrows on markers | Yes (speed > 2 m/s) | No | No |
| Status options | Reduced (only "Stopping" added) | Full set | Full set |
| "Stopping" ping | Available | Hidden | Hidden |
| Screen brightness | Prevent dimming (keep awake) | Normal | Normal |

---

## 6. MVP vs Non-MVP Screens

### MVP (Must Build)

| Screen | Priority | Notes |
|---|---|---|
| Sign In / Sign Up | P0 | Clerk handles UI, minimal custom work |
| Home | P0 | Session list + create CTA |
| Create Session (modal) | P0 | Name + mode + start |
| Join Gate | P0 | Deep link target, session preview |
| Live Session (map) | P0 | The entire product |
| Quick Action Bar | P0 | Status + pings |
| Session Panel (bottom sheet) | P0 | Member list + session controls |
| Invite Share Sheet | P0 | Link + QR + share |
| Session Ended | P1 | Summary screen |
| Profile | P1 | Name, avatar, sign out |
| Drive Mode Overlay | P1 | Large buttons, safety UI |
| Ping Toast | P1 | In-app alert for pings |
| Connection Banner | P1 | Disconnected / reconnecting states |

### Simplified for MVP

| Screen | Simplification |
|---|---|
| **Onboarding** | Combine profile setup + permissions into 1-2 screens. No tutorial slides. |
| **History** | Show past sessions as simple cards on the home screen. No dedicated history detail screen — just name, date, duration, member count inline. Defer the full history detail view. |
| **Settings** | Embed directly in profile screen as a simple list. No dedicated settings screen. Notification toggles, location link, sign out. |
| **Member Detail** | Show inline in bottom sheet member list, not as a separate screen. Tap member → expanded row with role + status + actions. |

### Deferred (NOT MVP)

| Screen/Feature | Reason |
|---|---|
| Explore / Discover | No public sessions in MVP |
| Session Templates | Phase 2 feature |
| Session Replay / Timeline | Phase 2 feature |
| Notification Preferences (granular) | Simplified toggles in profile are sufficient |
| Multi-stop Agenda UI | Single destination for MVP |
| QR Scanner (in-app) | Users can scan QR codes with their device camera; in-app scanner is a polish feature |
| Session Settings (dedicated screen) | Host actions (end, change mode) live in the bottom sheet panel |

---

## 7. UI/UX Principles

### 1. Safety-First Interaction Design

The app will be used while driving, walking, and in loud/dark environments. Every interaction must respect this.

- **Zero typing during sessions.** All session communication is tap-based: status selectors, ping buttons, navigate-to-destination. No chat, no text input on the live session screen.
- **Large touch targets in Drive mode.** Minimum 72x72 dp. Three actions max visible. Think "car mount at arm's length."
- **Keep screen awake in Drive mode.** Prevent device sleep so the map stays visible without repeated unlocking.

### 2. Map-First Design

The map is the product. Everything else is secondary.

- **Map is always full-screen** during a session. UI elements overlay the map, they don't compete with it.
- **Bottom sheet, not navigation push** for session details. The user never leaves the map context while in a session.
- **Minimal map chrome.** Reduce Google Maps default controls. Custom floating buttons for center-on-self and center-on-group.

### 3. Fast Access to Key Actions

The most common actions must be reachable in 1 tap from the live session screen.

| Action | Taps Required |
|---|---|
| See where everyone is | 0 (already visible on map) |
| Set my status | 1 (tap status chip) + 1 (select status) = 2 |
| Send a ping | 1 (tap ping) + 1 (select type) = 2 |
| Navigate to destination | 1 (tap destination pin) + 1 (tap Navigate) = 2 |
| Invite someone | 1 (tap invite icon in header) |
| See member list | 1 (pull up bottom sheet) |

### 4. Real-Time Feedback Clarity

Users must trust that what they see is current.

- **Stale indicators:** Markers older than 60s dim and show "last seen X ago."
- **Connection status:** Always visible when degraded (banner: "Reconnecting...").
- **Optimistic updates:** Status changes and pings appear instantly on the sender's device, then confirm from server.
- **Smooth marker animation:** Markers glide to new positions. Never teleport.

### 5. Low Cognitive Load

The app should be comprehensible at a glance.

- **No modal overload.** Maximum one modal/sheet open at a time.
- **Status over numbers.** "Alex is here" (green badge) is better than "Alex: lat 34.05, updated 3s ago."
- **Color-coded everything.** Status colors are consistent across markers, member list, and badges. Green = here. Blue = on the way. Orange = running late. Red = need help.
- **Progressive disclosure.** Map shows the essentials. Bottom sheet reveals details. Member detail reveals actions. Layer complexity, don't front-load it.

### 6. Session-Scoped Trust

Users share their location because sessions have clear boundaries.

- **Location sharing starts when you join, stops when you leave or the session ends.** Make this visible and explicit.
- **"Sharing your location" indicator** on the live session screen — small but always visible.
- **Session end = location stop.** Reinforce this in the session ended screen: "Location sharing has stopped."

### 7. Mobile-First Ergonomics

- **Thumb-reachable actions.** Quick action bar and bottom sheet are in the bottom third of the screen (thumb zone). Header actions are secondary.
- **No horizontal scrolling.** Everything is vertical or in a grid.
- **Respect safe areas.** Header content accounts for notch/dynamic island. Bottom actions account for home indicator.
- **Dark-friendly.** Map + overlay UI should work in both light and dark environments. Consider dark map style as default for drive mode (reduces glare at night).

---

## 8. File & Component Structure

Based on the architecture defined in the frontend patterns doc, with refinements for the screen system:

```
apps/mobile/src/
├── app/                                    # Expo Router — screens (THIN)
│   ├── _layout.tsx                         # Root layout (auth check, providers)
│   ├── (auth)/
│   │   ├── _layout.tsx                     # Auth stack layout
│   │   ├── sign-in.tsx                     # Clerk <SignIn />
│   │   └── sign-up.tsx                     # Clerk <SignUp />
│   ├── (tabs)/
│   │   ├── _layout.tsx                     # Tab navigator layout (Home, Profile)
│   │   ├── index.tsx                       # Home screen
│   │   └── profile.tsx                     # Profile screen
│   ├── session/
│   │   ├── create.tsx                      # Session creation modal
│   │   ├── [id]/
│   │   │   └── index.tsx                   # Live Session screen (THE core screen)
│   │   └── join/
│   │       └── [code].tsx                  # Join Gate (deep link target)
│   ├── history/
│   │   └── [id].tsx                        # Session history detail (deferred)
│   └── onboarding/
│       ├── _layout.tsx                     # Onboarding stack layout
│       └── setup.tsx                       # Profile + permissions (combined)
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── AuthGuard.tsx               # Redirect unauthenticated users
│   │   └── hooks/
│   │       └── useAuth.ts                  # Auth state wrapper
│   │
│   ├── session/
│   │   ├── components/
│   │   │   ├── SessionCard.tsx             # Session card for home list
│   │   │   ├── InviteCard.tsx              # Pending invite card
│   │   │   ├── HistoryCard.tsx             # Past session card
│   │   │   ├── SessionCreateForm.tsx       # Creation form (name, mode, desc)
│   │   │   ├── SessionHeader.tsx           # Live session header overlay
│   │   │   ├── SessionPanel.tsx            # Bottom sheet content
│   │   │   ├── SessionEndedSummary.tsx     # Post-session summary
│   │   │   ├── QuickActionBar.tsx          # Status + ping bar
│   │   │   ├── StatusSelector.tsx          # Status picker popup
│   │   │   ├── PingSelector.tsx            # Ping picker popup
│   │   │   ├── InviteShareSheet.tsx        # Share link + QR
│   │   │   ├── MemberList.tsx              # Member list in panel
│   │   │   ├── MemberRow.tsx               # Individual member item
│   │   │   ├── JoinGate.tsx                # Join session preview
│   │   │   └── DriveMode.tsx               # Drive mode quick action overlay
│   │   ├── hooks/
│   │   │   ├── useSession.ts               # Fetch single session
│   │   │   ├── useSessionList.ts           # Fetch user's sessions
│   │   │   ├── useSessionActions.ts        # Create, join, leave, end mutations
│   │   │   ├── useQuickActions.ts          # Ping + status actions
│   │   │   ├── useSessionSocket.ts         # Socket room lifecycle
│   │   │   └── useSessionMembers.ts        # Member list with real-time updates
│   │   ├── stores/
│   │   │   └── sessionStore.ts             # Active session Zustand state
│   │   └── types.ts
│   │
│   ├── map/
│   │   ├── components/
│   │   │   ├── SessionMap.tsx              # Map container with all layers
│   │   │   ├── MemberMarker.tsx            # Individual member marker
│   │   │   ├── MemberMarkerCluster.tsx     # Clustered markers at low zoom
│   │   │   ├── DestinationPin.tsx          # Destination marker
│   │   │   ├── MapControls.tsx             # Center-on-self, center-on-group
│   │   │   └── ConnectionBanner.tsx        # Reconnecting / disconnected
│   │   ├── hooks/
│   │   │   ├── useMapRegion.ts             # Map camera control
│   │   │   └── useMapMarkers.ts            # Derive markers from session store
│   │   └── utils/
│   │       ├── geo.ts                      # Distance, bearing calculations
│   │       └── interpolation.ts            # Smooth marker movement
│   │
│   ├── location/
│   │   ├── hooks/
│   │   │   ├── useLocationStream.ts        # Foreground location tracking
│   │   │   ├── useBackgroundLocation.ts    # Drive mode background tracking
│   │   │   └── useLocationPermission.ts    # Permission request + status
│   │   ├── services/
│   │   │   └── locationTask.ts             # Background task definition
│   │   └── types.ts
│   │
│   ├── presence/
│   │   ├── hooks/
│   │   │   └── usePresence.ts              # Heartbeat + presence subscription
│   │   └── components/
│   │       └── PresenceDot.tsx             # Green/yellow/red dot indicator
│   │
│   └── notifications/
│       ├── hooks/
│       │   └── usePushSetup.ts             # Register push token on mount
│       ├── components/
│       │   ├── PingToast.tsx               # Animated ping notification
│       │   └── AlertBanner.tsx             # Destination change / system alerts
│       └── services/
│           └── notificationHandler.ts      # Background notification routing
│
├── components/                             # Shared design system
│   ├── ui/
│   │   ├── Button.tsx                      # Primary, secondary, ghost, destructive
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Chip.tsx                        # Mode selector, status chip
│   │   ├── BottomSheet.tsx                 # Reusable bottom sheet wrapper
│   │   ├── Toast.tsx                       # In-app toast/banner
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SkeletonLoader.tsx              # Shimmer loading placeholders
│   │   └── ConfirmDialog.tsx               # "Are you sure?" modal
│   └── layout/
│       ├── ScreenContainer.tsx             # Safe area + background wrapper
│       ├── Header.tsx
│       └── TabBar.tsx                      # Custom tab bar (2 tabs)
│
├── lib/
│   ├── api.ts                              # REST client with Clerk token
│   ├── socket.ts                           # Socket.io singleton
│   ├── queryClient.ts                      # TanStack Query config
│   ├── clerk.ts                            # Clerk config
│   └── linking.ts                          # Deep link configuration
│
├── store/
│   └── appStore.ts                         # Connectivity, permissions, app-wide state
│
├── theme/
│   ├── colors.ts                           # Color tokens (brand, semantic, status)
│   ├── typography.ts                       # Font sizes, weights, families
│   ├── spacing.ts                          # 4/8/12/16/24/32/48 scale
│   └── index.ts                            # Re-exports
│
└── types/
    └── navigation.ts                       # Route param types
```

### Component Responsibility Rules

| Layer | Responsibility | State Access |
|---|---|---|
| `app/` screens | Route params, compose feature containers, handle navigation | None (delegates to features) |
| `features/*/components/` | Business logic, state subscriptions, event handlers | Zustand stores, TanStack Query, Socket.io |
| `components/ui/` | Render props, call callbacks, be beautiful | Props only. Zero domain knowledge. |

---

## 9. Final Summary

### MVP Screen List (14 unique routes/screens)

1. Sign In
2. Sign Up
3. Onboarding (profile + permissions, combined)
4. Home
5. Create Session (modal)
6. Join Gate
7. Live Session (map + quick actions + bottom sheet panel)
8. Drive Mode (overlay variant of live session)
9. Invite Share Sheet (bottom sheet)
10. Destination Picker (modal)
11. Session Ended
12. Profile
13. Connection Banner (overlay component, not a screen)
14. Ping Toast (overlay component, not a screen)

Actual **Expo Router routes: 9** (sign-in, sign-up, onboarding/setup, tabs/index, tabs/profile, session/create, session/[id]/index, session/join/[code], history/[id]).

Everything else is modals, bottom sheets, or overlays within those routes.

---

### Most Critical Screen: Live Session

The Live Session screen (`session/[id]/index.tsx`) IS the product. If this screen is excellent, the app succeeds. If it's confusing, slow, or cluttered, nothing else matters.

**What makes it hard:**
- It composites 6+ real-time data streams (member locations, presence, statuses, destination, pings, connection state) into one coherent view
- It must work across three radically different interaction modes (Drive / Walk / Hang)
- It must remain performant with 15-20 animated markers updating every 3-5 seconds
- It must be safe to glance at while driving (Drive mode)
- It must handle disconnection, reconnection, and state reconciliation without user intervention
- It must fit map, quick actions, and a pull-up panel into one screen without feeling cramped

**Build this screen first. Test it with 2 devices. Make it feel alive.**

---

### Biggest UX Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Map performance with many markers** | High | Set `tracksViewChanges={false}`, cluster markers at low zoom, profile early on mid-range Android devices |
| **Drive mode safety** | High | Ruthlessly enforce large targets, no typing, minimal options. User-test with a phone in a car mount. Consider keeping the screen static (no scrolling) in Drive mode. |
| **Stale data mistaken for live data** | High | Aggressive "last seen" indicators. Dim stale markers. Connection banners. Never show a marker without a timestamp context. |
| **Bottom sheet conflicts with map gestures** | Medium | Use a well-tested bottom sheet library (e.g., `@gorhom/bottom-sheet`). Test sheet drag vs. map pan extensively. Sheet should only capture vertical gestures at the handle, not over the map. |
| **Session creation friction** | Medium | Keep it to 2 fields (name + mode). No required destination, no required description. Target: session created in under 8 seconds. |
| **Deep link join flow fragility** | Medium | Test on both platforms: app installed vs. not installed, authenticated vs. not, expired vs. active session. Every combination must be handled gracefully. |
| **Notification overload in large sessions** | Low (MVP) | 15 members each sending pings could be noisy. 10-second ping cooldown per user. Batch "member joined" notifications if multiple arrive within 5 seconds ("3 people joined"). |

---

### Recommended First 5 Screens to Build (in order)

1. **Sign In / Sign Up** — Clerk handles the UI. Get auth working end-to-end first. This unblocks every other screen.

2. **Home Screen** — Session list + create CTA. Even with no sessions, this establishes the app shell and navigation structure. Build the empty state first.

3. **Create Session (modal)** — Name + mode + start. Connect to the API. Get a real session created and visible on the home screen.

4. **Live Session Screen** — The product. Start with the map + your own marker. Then add member markers from the socket. Then add the quick action bar. Then the bottom sheet. Build in layers.

5. **Join Gate** — Deep link target. Test with a second device. "Person A creates session → gets link → Person B taps link → joins → both see each other on the map." This is the first complete user story.

After these 5, the core loop is functional. Everything else (invite sharing, drive mode, session ended, profile) builds on top.
