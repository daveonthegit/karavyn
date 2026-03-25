import { z } from 'zod';

export const sessionModeSchema = z.enum(['drive', 'walk', 'hang']);
export const sessionStatusSchema = z.enum(['active', 'ended']);

export const createSessionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  mode: sessionModeSchema,
});

export const sessionSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  mode: sessionModeSchema,
  status: sessionStatusSchema,
  inviteCode: z.string(),
  createdAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
});

export type SessionMode = z.infer<typeof sessionModeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;
