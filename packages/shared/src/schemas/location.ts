import { z } from 'zod';

export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).nullable(),
  speed: z.number().min(0).nullable(),
  accuracy: z.number().min(0),
  timestamp: z.string().datetime(),
});

export type LocationUpdate = z.infer<typeof locationUpdateSchema>;
