import type { LocationUpdate, MemberStatus } from '../schemas';

export interface MemberInfo {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'host' | 'mod' | 'member';
  status: MemberStatus | null;
  presence: 'active' | 'idle' | 'disconnected';
  location: LocationUpdate | null;
  joinedAt: string;
}

export interface SessionStateSnapshot {
  sessionId: string;
  name: string;
  mode: 'drive' | 'walk' | 'hang';
  status: 'active' | 'ended';
  version: number;
  members: MemberInfo[];
  destination: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    setBy: string;
  } | null;
}

export interface SessionEvent {
  type: string;
  userId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface ServerToClientEvents {
  'session:state': (data: SessionStateSnapshot) => void;
  'session:ended': (data: { endedBy: string; reason: string }) => void;
  'session:modeChanged': (data: { mode: 'drive' | 'walk' | 'hang' }) => void;

  'member:joined': (data: MemberInfo) => void;
  'member:left': (data: { userId: string; reason: 'left' | 'removed' | 'timeout' }) => void;
  'member:roleChanged': (data: { userId: string; role: string }) => void;

  'location:broadcast': (data: { userId: string } & LocationUpdate) => void;

  'presence:update': (data: {
    userId: string;
    presence: 'active' | 'idle' | 'disconnected';
  }) => void;

  'ping:received': (data: {
    userId: string;
    displayName: string;
    type: string;
    scope: 'broadcast' | 'personal';
  }) => void;
  'status:changed': (data: { userId: string; status: MemberStatus | null }) => void;

  'destination:updated': (
    data: {
      name: string;
      lat: number;
      lng: number;
      address?: string;
      setBy: string;
    } | null,
  ) => void;

  'session:missedEvents': (data: SessionEvent[]) => void;

  error: (data: { code: string; message: string }) => void;
}
