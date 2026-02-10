import { z } from 'zod';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Bun auto-loads .env from cwd, but in a monorepo cwd is apps/api/
// while .env lives at the repo root. Load it explicitly if needed.
if (!process.env.JWT_SECRET) {
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
  // Explicit URLs (prod/Railway) — if set, override derived values
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  APP_URL: z.string().optional(),

  // Individual components (dev) — used to derive URLs if not set explicitly
  POSTGRES_DB_PORT: z.coerce.number().default(5433),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  POSTGRES_DB_NAME: z.string().default('ai_mail_agent'),
  POSTGRES_HOST: z.string().default('localhost'),
  REDIS_CACHE_PORT: z.coerce.number().default(6379),
  REDIS_HOST: z.string().default('localhost'),
  BACKEND_API_PORT: z.coerce.number().default(3005),
  INBOXRULES_FRONTEND_PORT: z.coerce.number().default(3004),
  DASHBOARD_FRONTEND_PORT: z.coerce.number().default(3006),

  JWT_SECRET: z.string().min(16),
  GMAIL_CLIENT_ID: z.string().default(''),
  GMAIL_CLIENT_SECRET: z.string().default(''),
  GMAIL_REDIRECT_URI: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().default(''),
  GMAIL_PUBSUB_TOPIC: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  WEBHOOK_SECRET: z.string().default('whsec_dev_default'),
  STRIPE_PRICE_STARTER: z.string().default(''),
  STRIPE_PRICE_PRO: z.string().default(''),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema> & {
  DATABASE_URL: string;
  REDIS_URL: string;
  APP_URL: string;
  GMAIL_REDIRECT_URI: string;
};

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  const data = result.data;
  const appUrl = data.APP_URL || `http://localhost:${data.BACKEND_API_PORT}`;
  return {
    ...data,
    DATABASE_URL: data.DATABASE_URL || `postgresql://${data.POSTGRES_USER}:${data.POSTGRES_PASSWORD}@${data.POSTGRES_HOST}:${data.POSTGRES_DB_PORT}/${data.POSTGRES_DB_NAME}`,
    REDIS_URL: data.REDIS_URL || `redis://${data.REDIS_HOST}:${data.REDIS_CACHE_PORT}`,
    APP_URL: appUrl,
    GMAIL_REDIRECT_URI: data.GMAIL_REDIRECT_URI || `${appUrl}/api/auth/gmail/callback`,
  };
}

export const env = loadEnv();
