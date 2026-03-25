import type { LocationUpdate, PingType, MemberStatus } from '../schemas';

export interface ClientToServerEvents {
  'session:join': (data: { sessionId: string }) => void;
  'session:leave': (data: { sessionId: string }) => void;
  'session:rejoin': (data: { sessionId: string; lastStateVersion: number }) => void;

  'location:update': (data: LocationUpdate) => void;

  'presence:heartbeat': () => void;

  'ping:send': (data: { type: PingType; scope: 'broadcast' | 'personal' }) => void;
  'status:set': (data: { status: MemberStatus | null }) => void;

  'destination:set': (data: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    placeId?: string;
  }) => void;
  'destination:clear': () => void;

  'member:promote': (data: { userId: string; role: 'mod' }) => void;
  'member:demote': (data: { userId: string }) => void;
  'member:remove': (data: { userId: string }) => void;

  'session:changeMode': (data: { mode: 'drive' | 'walk' | 'hang' }) => void;
  'session:end': () => void;
}
