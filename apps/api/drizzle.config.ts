import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '../../.env' });

const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_DB_PORT || '5433';
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const dbName = process.env.POSTGRES_DB_NAME || 'ai_mail_agent';

const url = process.env.DATABASE_URL || `postgresql://${user}:${password}@${host}:${port}/${dbName}`;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
});
