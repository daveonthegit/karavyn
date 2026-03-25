import { z } from 'zod';

export const setDestinationSchema = z.object({
  name: z.string().min(1).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  placeId: z.string().optional(),
});

export const destinationSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string().nullable(),
  setBy: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type SetDestinationInput = z.infer<typeof setDestinationSchema>;
export type Destination = z.infer<typeof destinationSchema>;
