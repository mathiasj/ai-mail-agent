import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  GMAIL_CLIENT_ID: z.string().default(''),
  GMAIL_CLIENT_SECRET: z.string().default(''),
  GMAIL_REDIRECT_URI: z.string().default('http://localhost:3000/api/auth/gmail/callback'),
  GOOGLE_CLOUD_PROJECT_ID: z.string().default(''),
  GMAIL_PUBSUB_TOPIC: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PRICE_PRO: z.string().default(''),
  STRIPE_PRICE_TEAM: z.string().default(''),
  APP_URL: z.string().default('http://localhost:3000'),
  PORT: z.coerce.number().default(3000),
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
