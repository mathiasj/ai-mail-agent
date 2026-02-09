// Set required env vars before env.ts Zod validation runs
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_SECRET ??= 'test-jwt-secret-at-least-16-chars';
process.env.NODE_ENV = 'test';
