import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.url().nullable(),
  email: z.email().nullable(),
  createdAt: z.iso.datetime(),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.url().nullable().optional(),
});

export type User = z.infer<typeof userSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
