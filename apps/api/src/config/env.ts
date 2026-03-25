import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env.local' });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
