export type { MemberRole } from './member';
export type { PresenceState } from './presence';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
