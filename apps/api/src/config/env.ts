import { z } from 'zod';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Bun auto-loads .env from cwd, but in a monorepo cwd is apps/api/
// while .env lives at the repo root. Load it explicitly if needed.
if (!process.env.DATABASE_URL) {
  const rootEnv = resolve(import.meta.dir, '../../../../.env');
  if (existsSync(rootEnv)) {
    const file = Bun.file(rootEnv);
    const text = await file.text();
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  GMAIL_CLIENT_ID: z.string().default(''),
  GMAIL_CLIENT_SECRET: z.string().default(''),
  GMAIL_REDIRECT_URI: z.string().default('http://localhost:3005/api/auth/gmail/callback'),
  GOOGLE_CLOUD_PROJECT_ID: z.string().default(''),
  GMAIL_PUBSUB_TOPIC: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PRICE_PRO: z.string().default(''),
  STRIPE_PRICE_TEAM: z.string().default(''),
  APP_URL: z.string().default('http://localhost:3005'),
  PORT: z.coerce.number().default(3005),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return result.data;
}

export const env = loadEnv();
