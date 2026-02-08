# AI Mail Agent - Claude Context

## Project Overview

SaaS platform where users connect Gmail accounts and let AI agents manage their email — classify, summarize, draft replies, and auto-respond based on smart rules.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Hono (TypeScript) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Queue | BullMQ + Redis 7 |
| Cache | Redis |
| AI/LLM | OpenAI GPT-4o (drafts), GPT-4o-mini (classification) |
| Email | Gmail API + Pub/Sub webhooks |
| Auth | JWT (jose) + Google OAuth 2.0 |
| Payments | Stripe (subscriptions) |
| Frontend | Next.js 14 + React + TailwindCSS |
| Real-time | Server-Sent Events (SSE) |
| Deployment | Docker + docker-compose |

## Project Structure

```
src/
├── api/
│   ├── routes/          # Hono route handlers
│   │   ├── auth.ts      # Signup, login, Gmail OAuth, account management
│   │   ├── emails.ts    # List, search, get, archive emails
│   │   ├── drafts.ts    # Generate, edit, approve/send drafts
│   │   ├── rules.ts     # CRUD for email automation rules
│   │   ├── payments.ts  # Stripe checkout, portal, subscription status
│   │   └── sse.ts       # Real-time Server-Sent Events
│   └── webhooks/
│       ├── gmail.ts     # Gmail Pub/Sub push notifications
│       └── stripe.ts    # Stripe subscription lifecycle
├── auth/
│   ├── jwt.ts           # JWT sign/verify
│   ├── middleware.ts     # Hono auth middleware
│   └── gmail-oauth.ts   # Gmail OAuth 2.0 flow + watch setup
├── config/
│   └── env.ts           # Zod-validated env vars
├── core/
│   ├── email-parser.ts  # Gmail message parser (multipart, base64, HTML)
│   └── rules-engine.ts  # Condition matching + action execution
├── db/
│   ├── schema.ts        # Drizzle schema (6 tables)
│   └── client.ts        # PostgreSQL connection
├── workers/
│   ├── queue.ts         # BullMQ queue definitions
│   ├── email-fetcher.ts # Fetches emails via Gmail API
│   ├── classifier.ts    # GPT-4o-mini classification worker
│   └── draft-generator.ts # GPT-4o draft + Gmail send
└── index.ts             # Hono server entry point

frontend/                # Next.js 14 app (Phase 3)
drizzle/                 # Generated SQL migrations
```

## Database Tables

- `users` — Auth, tier, Stripe customer ID
- `gmail_accounts` — OAuth tokens, watch expiry, history ID
- `emails` — Full email data + AI classification (category, priority, summary, entities)
- `drafts` — AI-generated reply drafts, approval status
- `rules` — User-defined automation rules (conditions → actions)
- `subscriptions` — Stripe subscription tracking

## Key API Endpoints

```
POST   /api/auth/signup              # Create account
POST   /api/auth/login               # Login → JWT
GET    /api/auth/me                  # Current user
GET    /api/auth/gmail/connect       # Start Gmail OAuth
GET    /api/auth/gmail/callback      # Gmail OAuth callback
GET    /api/auth/gmail/accounts      # List connected accounts
DELETE /api/auth/gmail/accounts/:id  # Disconnect account

GET    /api/emails                   # List (paginated, filterable, searchable)
GET    /api/emails/:id               # Get single + mark read
PATCH  /api/emails/:id/archive       # Archive
GET    /api/emails/stats/overview    # Category stats + unread count

POST   /api/drafts/generate          # Queue AI draft generation
GET    /api/drafts                   # List pending drafts
GET    /api/drafts/:id               # Get draft
PATCH  /api/drafts/:id               # Edit draft content
POST   /api/drafts/:id/send          # Approve + send
DELETE /api/drafts/:id               # Delete draft

GET    /api/rules                    # List rules
POST   /api/rules                    # Create rule
GET    /api/rules/:id                # Get rule
PUT    /api/rules/:id                # Update rule
PATCH  /api/rules/:id/toggle         # Toggle enabled
DELETE /api/rules/:id                # Delete rule

POST   /api/payments/checkout        # Create Stripe checkout
POST   /api/payments/portal          # Stripe billing portal
GET    /api/payments/subscription    # Get subscription status

GET    /api/events/stream?token=...  # SSE real-time events

POST   /webhooks/gmail               # Gmail Pub/Sub push
POST   /webhooks/stripe              # Stripe events
```

## Pricing Tiers

| Tier | Price | Accounts | Emails/mo | Drafts/mo |
|------|-------|----------|-----------|-----------|
| Free | $0 | 1 | 100 | 10 |
| Pro | $15/mo | 3 | 1,000 | 100 |
| Team | $50/mo | 10 | 10,000 | Unlimited |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

## Email Processing Pipeline

```
Gmail Webhook → emailQueue (fetch) → classifyQueue (GPT-4o-mini) → rules engine → draftQueue (GPT-4o) → SSE notify
```

## Conventions

- All code is TypeScript (strict mode)
- Zod for all input validation
- Drizzle ORM for all DB queries (no raw SQL)
- BullMQ for all background jobs
- JWT Bearer auth on all /api/* routes (except auth + webhooks)
- Hono route groups per domain
- Workers run as separate processes

## Development Commands

```bash
docker-compose up -d          # Start PostgreSQL + Redis
bun run db:push               # Push schema to DB
bun run dev                   # Start API server (port 3000)
bun run worker:all            # Start all workers
cd frontend && bun run dev    # Start frontend (port 3001)
bun run typecheck             # Type check
bun test                      # Run tests
```

---

## Implementation Progress

### Phase 1: Core Infrastructure — COMPLETE
- [x] Bun + Hono + TypeScript project setup
- [x] PostgreSQL + Drizzle schema (6 tables, migrations generated)
- [x] Redis + BullMQ queue setup
- [x] JWT auth (signup, login, middleware)
- [x] Gmail OAuth 2.0 (connect, callback, token refresh, watch)
- [x] Gmail Pub/Sub webhook handler
- [x] Email fetcher worker (initial sync + incremental)

### Phase 2: Email Processing — COMPLETE
- [x] Email parser (multipart, base64, HTML stripping)
- [x] Email classifier (GPT-4o-mini: category, priority, summary, entities)
- [x] Rules engine (condition matching, action execution)
- [x] Draft generator (GPT-4o, template support)
- [x] Draft send via Gmail API

### Phase 3: Frontend MVP — COMPLETE
- [x] Next.js 14 setup with TailwindCSS
- [x] Landing page (hero, features, pricing, CTA)
- [x] Auth pages (signup, login)
- [x] Inbox UI (real-time via SSE, category filters, search)
- [x] Email viewer (full content, AI summary, draft panel)
- [x] Draft editor (edit AI draft, approve/send)
- [x] Drafts page (list pending, approve/discard)
- [x] Rules builder (condition/action UI, toggle, delete)
- [x] Account settings (connect Gmail, manage accounts, billing)
- [x] App layout with sidebar navigation
- [x] Auth context + protected routes
- [x] API client library
- [x] SSE hook for real-time updates

### Phase 4: Payments & Multi-Account — COMPLETE
- [x] Stripe checkout integration (frontend buttons wired)
- [x] Billing portal page (in settings)
- [x] Multi-account switcher UI (inbox dropdown filter)
- [x] Usage limits enforcement middleware (src/core/usage-limits.ts)
- [x] Tier-gated features (draft limit check, account limit check)
- [x] Usage dashboard in settings (progress bars for accounts, emails, drafts)

### Phase 5: Advanced Features — COMPLETE
- [x] Auto-reply safety (cooldown, max per sender per day, no-reply patterns, blocklist)
- [x] Analytics dashboard (total emails, categories, daily volume, top senders, draft acceptance rate)
- [x] Data export (CSV, JSON with date/category filters)
- [ ] OpenClaw agent routing (optional — deferred)

### Phase 6: Production Launch — COMPLETE
- [x] Production Docker Compose (API, 3 workers, frontend, PostgreSQL, Redis)
- [x] Frontend Dockerfile (standalone Next.js build)
- [x] Rate limiting middleware (Redis-backed, per-endpoint config)
- [x] Health check endpoint
- [x] Security hardening (rate limits on auth/AI, CORS, input validation)
- [ ] Monitoring (Langfuse, Sentry) — add when deploying
- [ ] Marketing site content — polish when launching
