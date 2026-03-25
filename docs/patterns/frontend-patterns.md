# Karavyn — Frontend Patterns

> **Version:** 1.0
> **Last updated:** March 2026

---

## Architecture: Feature-Based Modules

The mobile app uses a **feature-based architecture**. Code is organized by product feature, not by technical layer. Each feature owns its screens, components, hooks, and types.

```
apps/mobile/src/
├── app/                          # Expo Router pages (file-based routing)
│   ├── (auth)/                   # Auth screens (sign-in, sign-up)
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home / session list
│   │   ├── explore.tsx           # Future: discover sessions
│   │   └── profile.tsx           # User profile
│   ├── session/
│   │   ├── create.tsx            # Session creation flow
│   │   ├── [id]/
│   │   │   ├── index.tsx         # Live session screen (map + members)
│   │   │   ├── members.tsx       # Full member list
│   │   │   └── settings.tsx      # Session settings (host only)
│   │   └── join/[code].tsx       # Join via invite code (deep link target)
│   ├── history/
│   │   └── [id].tsx              # Session history detail
│   └── _layout.tsx               # Root layout
│
├── features/                     # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   │   └── AuthGuard.tsx
│   │   └── hooks/
│   │       └── useAuth.ts
│   ├── session/
│   │   ├── components/
│   │   │   ├── SessionCard.tsx
│   │   │   ├── SessionCreateForm.tsx
│   │   │   ├── SessionHeader.tsx
│   │   │   ├── QuickActionBar.tsx
│   │   │   ├── StatusSelector.tsx
│   │   │   └── InviteShareSheet.tsx
│   │   ├── hooks/
│   │   │   ├── useSession.ts
│   │   │   ├── useSessionList.ts
│   │   │   ├── useSessionActions.ts
│   │   │   └── useQuickActions.ts
│   │   ├── stores/
│   │   │   └── sessionStore.ts
│   │   └── types.ts
│   ├── map/
│   │   ├── components/
│   │   │   ├── SessionMap.tsx
│   │   │   ├── MemberMarker.tsx
│   │   │   ├── DestinationPin.tsx
│   │   │   ├── CenterOnGroupButton.tsx
│   │   │   └── MapOverlay.tsx
│   │   ├── hooks/
│   │   │   ├── useMapRegion.ts
│   │   │   └── useMapMarkers.ts
│   │   └── utils/
│   │       └── geo.ts
│   ├── location/
│   │   ├── hooks/
│   │   │   ├── useLocationStream.ts
│   │   │   └── useBackgroundLocation.ts
│   │   ├── services/
│   │   │   └── locationTask.ts
│   │   └── types.ts
│   ├── presence/
│   │   ├── hooks/
│   │   │   └── usePresence.ts
│   │   └── components/
│   │       └── PresenceBadge.tsx
│   └── notifications/
│       ├── hooks/
│       │   └── usePushToken.ts
│       └── services/
│           └── notificationHandler.ts
│
├── components/                   # Shared UI components (design system)
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   └── layout/
│       ├── ScreenContainer.tsx
│       ├── Header.tsx
│       └── TabBar.tsx
│
├── lib/                          # Core utilities and clients
│   ├── api.ts                    # REST API client (fetch wrapper with auth)
│   ├── socket.ts                 # Socket.io client singleton
│   ├── queryClient.ts            # TanStack Query client configuration
│   └── clerk.ts                  # Clerk configuration
│
├── store/                        # Global stores (non-feature-specific)
│   └── appStore.ts               # App-wide state (connectivity, permissions)
│
├── theme/                        # Design tokens and theming
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
│
└── types/                        # App-wide type utilities
    └── navigation.ts
```

---

## Component Hierarchy

### Three-Layer Pattern

```
Screen (Expo Router page)
  └── Feature Container (logic, state, side effects)
       └── UI Components (presentational, stateless)
```

**Screens** (`app/` directory) are thin. They compose feature containers and handle route params. They should contain minimal logic.

**Feature Containers** (`features/*/components/`) own business logic and state connections. They use hooks to fetch data and manage state, then pass props down to UI components.

**UI Components** (`components/ui/`) are pure presentational. They take props, render UI, call callbacks. They know nothing about sessions, locations, or the domain. They are the design system.

### Example: Live Session Screen

```typescript
// app/session/[id]/index.tsx — SCREEN (thin)
export default function LiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenContainer>
      <SessionHeader sessionId={id} />
      <SessionMap sessionId={id} />
      <QuickActionBar sessionId={id} />
    </ScreenContainer>
  );
}

// features/session/components/SessionHeader.tsx — FEATURE CONTAINER
export function SessionHeader({ sessionId }: { sessionId: string }) {
  const session = useSession(sessionId);
  const members = useSessionMembers(sessionId);

  if (!session) return <LoadingSpinner />;

  return (
    <Header
      title={session.name}
      subtitle={`${members.length} members · ${session.mode} mode`}
      rightAction={<InviteShareSheet sessionId={sessionId} />}
    />
  );
}

// components/ui/Header.tsx — UI COMPONENT (presentational)
export function Header({ title, subtitle, rightAction }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {rightAction}
    </View>
  );
}
```

---

## Hooks Conventions

### Naming

- `use[Entity]` — fetches and subscribes to an entity: `useSession(id)`, `useUser()`
- `use[Entity]List` — fetches a collection: `useSessionList()`, `useSessionMembers(id)`
- `use[Entity]Actions` — returns mutation functions: `useSessionActions()` → `{ create, join, end }`
- `use[Feature]` — feature-specific logic: `usePresence()`, `useLocationStream()`

### Data Hooks (TanStack Query)

Use TanStack Query for all server-fetched data. This gives you caching, background refetching, optimistic updates, and loading/error states for free.

```typescript
// features/session/hooks/useSession.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Session } from '@karavyn/shared';

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.get<Session>(`/sessions/${sessionId}`),
    staleTime: 30_000, // consider fresh for 30s (real-time updates via socket)
  });
}
```

### Real-Time Hooks (Socket.io)

Use custom hooks that subscribe to Socket.io events and update local state or invalidate queries.

```typescript
// features/presence/hooks/usePresence.ts
import { useEffect } from 'react';
import { useSocket } from '@/lib/socket';
import { useSessionStore } from '@/features/session/stores/sessionStore';

export function usePresence(sessionId: string) {
  const socket = useSocket();
  const updateMemberPresence = useSessionStore((s) => s.updateMemberPresence);

  useEffect(() => {
    socket.on('presence:update', (data) => {
      updateMemberPresence(data.userId, data.presence);
    });

    return () => {
      socket.off('presence:update');
    };
  }, [socket, sessionId]);
}
```

### Location Hook

```typescript
// features/location/hooks/useLocationStream.ts
import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useSocket } from '@/lib/socket';
import { useSessionStore } from '@/features/session/stores/sessionStore';

const MODE_INTERVALS = {
  drive: 3000,
  walk: 10000,
  hang: 30000,
} as const;

export function useLocationStream(sessionId: string, mode: SessionMode) {
  const socket = useSocket();
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: mode === 'hang'
            ? Location.Accuracy.Balanced
            : Location.Accuracy.High,
          timeInterval: MODE_INTERVALS[mode],
          distanceInterval: mode === 'drive' ? 10 : 5,
        },
        (location) => {
          if (location.coords.accuracy > 100) return; // too inaccurate
          socket.emit('location:update', {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toISOString(),
          });
        }
      );
    }

    startTracking();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
    };
  }, [sessionId, mode, socket]);
}
```

---

## State Management

### Three State Sources

| Source | What It Manages | Library |
|---|---|---|
| **TanStack Query** | Server-fetched data (sessions, user profile, history) | `@tanstack/react-query` |
| **Zustand** | Client-only state (active session state, UI state, connectivity) | `zustand` |
| **Socket.io events** | Real-time updates (location broadcasts, presence, pings) | `socket.io-client` |

### Zustand Store Pattern

Keep stores small and feature-scoped. One store per feature domain.

```typescript
// features/session/stores/sessionStore.ts
import { create } from 'zustand';
import type { MemberState, Destination, SessionMode } from '@karavyn/shared';

interface SessionStoreState {
  activeSessionId: string | null;
  members: Map<string, MemberState>;
  destination: Destination | null;
  mode: SessionMode;

  setActiveSession: (id: string | null) => void;
  setMembers: (members: Map<string, MemberState>) => void;
  updateMemberLocation: (userId: string, location: MemberLocation) => void;
  updateMemberPresence: (userId: string, presence: PresenceState) => void;
  updateMemberStatus: (userId: string, status: MemberStatus) => void;
  setDestination: (destination: Destination | null) => void;
  setMode: (mode: SessionMode) => void;
  addMember: (member: MemberState) => void;
  removeMember: (userId: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  activeSessionId: null,
  members: new Map(),
  destination: null,
  mode: 'hang',

  setActiveSession: (id) => set({ activeSessionId: id }),

  setMembers: (members) => set({ members }),

  updateMemberLocation: (userId, location) =>
    set((state) => {
      const members = new Map(state.members);
      const member = members.get(userId);
      if (member) {
        members.set(userId, { ...member, location });
      }
      return { members };
    }),

  updateMemberPresence: (userId, presence) =>
    set((state) => {
      const members = new Map(state.members);
      const member = members.get(userId);
      if (member) {
        members.set(userId, { ...member, presence });
      }
      return { members };
    }),

  // ... other setters follow the same pattern

  reset: () =>
    set({
      activeSessionId: null,
      members: new Map(),
      destination: null,
      mode: 'hang',
    }),
}));
```

---

## API Client Pattern

Single fetch-based API client with Clerk JWT injection.

```typescript
// lib/api.ts
import { useAuth } from '@clerk/clerk-expo';

class ApiClient {
  private baseUrl: string;
  private getToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokenProvider(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken?.();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(response.status, error.message, error.code);
    }

    return response.json();
  }
}

export const api = new ApiClient(process.env.EXPO_PUBLIC_API_URL!);
```

---

## Socket.io Client Pattern

Singleton socket with auth token and session room management.

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket() first.');
  }
  return socket;
}

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(process.env.EXPO_PUBLIC_API_URL!, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason);
  });

  return socket;
}

export function useSocket(): Socket {
  return getSocket();
}
```

---

## Map UI Patterns

### Member Markers

Each session member is a custom map marker showing their avatar, name, and status.

```typescript
// features/map/components/MemberMarker.tsx
import { Marker, Callout } from 'react-native-maps';
import { Avatar, PresenceBadge } from '@/components/ui';

interface MemberMarkerProps {
  member: MemberState;
  isCurrentUser: boolean;
}

export function MemberMarker({ member, isCurrentUser }: MemberMarkerProps) {
  if (!member.location) return null;

  const isStale = Date.now() - new Date(member.location.timestamp).getTime() > 60_000;

  return (
    <Marker
      coordinate={{
        latitude: member.location.lat,
        longitude: member.location.lng,
      }}
      tracksViewChanges={false} // critical for performance with many markers
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.markerContainer, isStale && styles.stale]}>
        <Avatar
          uri={member.avatarUrl}
          name={member.displayName}
          size={32}
        />
        <PresenceBadge presence={member.presence} />
      </View>

      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutName}>{member.displayName}</Text>
          {member.status && <Text style={styles.calloutStatus}>{member.status}</Text>}
          {isStale && <Text style={styles.staleLabel}>
            {formatTimeAgo(member.location.timestamp)}
          </Text>}
        </View>
      </Callout>
    </Marker>
  );
}
```

### Performance: `tracksViewChanges={false}`

This is critical. By default, `react-native-maps` re-renders markers on every frame. With 15+ markers updating frequently, this causes severe frame drops. Set `tracksViewChanges={false}` on all markers and manually trigger re-renders only when the marker's content changes.

### Destination Pin

```typescript
// features/map/components/DestinationPin.tsx
export function DestinationPin({ destination }: { destination: Destination }) {
  return (
    <Marker
      coordinate={{ latitude: destination.lat, longitude: destination.lng }}
      title={destination.name}
      description="Tap for directions"
      pinColor="red"
      onCalloutPress={() => openInMaps(destination)}
    />
  );
}
```

---

## Loading / Error / Empty State Patterns

Every screen and data-driven component must handle three states:

```typescript
function SessionListScreen() {
  const { data, isLoading, error } = useSessionList();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Couldn't load sessions" onRetry={refetch} />;
  if (data.length === 0) return <EmptyState
    title="No active sessions"
    description="Start a session or join one with an invite link."
    action={{ label: "Start Session", onPress: navigateToCreate }}
  />;

  return <SessionList sessions={data} />;
}
```

Standard empty state component:

```typescript
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}
```

---

## Navigation Patterns

### Expo Router Structure

```
(auth)/           → Auth screens (unauthenticated users only)
(tabs)/           → Main tab navigation (authenticated)
session/create    → Modal: session creation
session/[id]/     → Live session stack
session/join/[code] → Deep link: join session
history/[id]      → Session history detail
```

### Deep Link Handling

Invite links (`karavyn.app/join/ABC123`) must:
1. Open the app if installed (Universal Link / App Link)
2. Redirect to app store if not installed
3. Route to `session/join/[code]` screen
4. If not authenticated → sign in → then continue to join

Expo Router handles this with the `app.json` association config and a join screen that checks auth state.

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `SessionCard.tsx`, `MemberMarker.tsx` |
| Hooks | camelCase, `use` prefix | `useSession.ts`, `useLocationStream.ts` |
| Stores | camelCase, `Store` suffix | `sessionStore.ts` |
| Utils | camelCase | `geo.ts`, `formatTime.ts` |
| Types | PascalCase, exported from `types.ts` | `SessionMode`, `MemberState` |
| Screens (Expo Router) | kebab-case or bracket notation | `sign-in.tsx`, `[id].tsx` |
| Feature dirs | lowercase | `features/session/`, `features/map/` |
| Component dirs | lowercase | `components/ui/`, `components/layout/` |
