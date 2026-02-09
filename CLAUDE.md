# MailGate.ai + Inboxrules — Monorepo

## Project Overview

Dual-product Turborepo monorepo:
- **MailGate.ai** — B2B email API infrastructure for AI agents (developer portal)
- **Inboxrules** — B2C consumer email client (built on MailGate.ai API)

Shared backend powers both products. Users connect Gmail accounts; AI classifies, summarizes, drafts replies, and auto-responds via smart rules.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Runtime | Bun |
| Backend | Hono (TypeScript) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Queue | BullMQ + Redis 7 |
| Cache | Redis |
| AI/LLM | OpenAI GPT-4o (drafts), GPT-4o-mini (classification) |
| Email | Gmail API + Pub/Sub webhooks |
| Auth | JWT (jose) + Google OAuth 2.0 + API Keys (X-API-Key) |
| Payments | Stripe (dual subscriptions: Inboxrules + Dashboard) |
| Frontend | Next.js 14 + React + TailwindCSS |
| SDK | @mailgate/sdk (shared TypeScript client) |
| Real-time | Server-Sent Events (SSE) |
| Deployment | Docker + docker-compose |

## Project Structure

```
├── turbo.json                 # Turborepo pipeline config
├── pnpm-workspace.yaml        # Workspace definition
├── docker-compose.yml         # Dev: PostgreSQL + Redis
├── docker-compose.prod.yml    # Prod: all services
│
├── apps/
│   ├── api/                   # @mailgate/api — Hono backend (port 3005)
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── auth.ts          # Signup, login, Gmail OAuth
│   │   │   │   │   ├── emails.ts        # List, search, get, archive
│   │   │   │   │   ├── drafts.ts        # Generate, edit, approve/send
│   │   │   │   │   ├── rules.ts         # Automation rules CRUD
│   │   │   │   │   ├── api-keys.ts      # API key management
│   │   │   │   │   ├── audit.ts         # Audit log viewer
│   │   │   │   │   ├── filtering-rules.ts # Filtering rules CRUD
│   │   │   │   │   ├── payments.ts      # Stripe checkout/portal
│   │   │   │   │   └── sse.ts           # Real-time events
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── gmail.ts         # Gmail Pub/Sub push
│   │   │   │   │   └── stripe.ts        # Stripe lifecycle (dual products)
│   │   │   │   └── middleware/
│   │   │   │       ├── permissions.ts   # Permission-based access control
│   │   │   │       └── audit-log.ts     # Audit logging middleware
│   │   │   ├── auth/
│   │   │   │   ├── jwt.ts              # JWT sign/verify
│   │   │   │   ├── middleware.ts       # Dual auth: API key + JWT
│   │   │   │   └── gmail-oauth.ts     # Gmail OAuth 2.0
│   │   │   ├── config/
│   │   │   │   └── env.ts             # Zod-validated env vars
│   │   │   ├── core/
│   │   │   │   ├── email-parser.ts    # Gmail message parser
│   │   │   │   ├── rules-engine.ts    # Automation rule execution
│   │   │   │   ├── filtering-engine.ts # Rule-based email filtering
│   │   │   │   └── usage-limits.ts    # Tier limits + usage checks
│   │   │   ├── db/
│   │   │   │   ├── schema.ts          # Drizzle schema (9 tables)
│   │   │   │   └── client.ts          # PostgreSQL connection
│   │   │   ├── workers/
│   │   │   │   ├── queue.ts           # BullMQ queue definitions
│   │   │   │   ├── email-fetcher.ts   # Gmail API fetch worker
│   │   │   │   ├── classifier.ts      # Hybrid filtering + AI classification
│   │   │   │   └── draft-generator.ts # GPT-4o draft + Gmail send
│   │   │   └── index.ts              # Hono server entry (v1 + legacy routes)
│   │   ├── drizzle/                   # Generated SQL migrations
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── inboxrules/            # @mailgate/inboxrules — Inboxrules consumer email client (port 3004)
│   │   ├── src/
│   │   │   ├── app/           # Next.js 14 app router pages
│   │   │   └── lib/
│   │   │       ├── api.ts     # SDK-backed API wrapper
│   │   │       └── hooks/     # useAuth, useSSE
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── dashboard/             # @mailgate/dashboard — Developer portal (port 3006)
│       ├── src/
│       │   ├── app/           # Next.js 14 app router pages
│       │   └── lib/
│       │       ├── api.ts     # SDK-backed Dashboard API
│       │       └── hooks/     # useAuth
│       └── package.json
│
└── packages/
    ├── config/                # @mailgate/config — Shared configs
    │   ├── tsconfig/          # base.json, nextjs.json, bun.json
    │   └── tailwind/          # base.ts (brand indigo palette)
    ├── sdk/                   # @mailgate/sdk — TypeScript API client
    │   └── src/
    │       ├── client.ts      # MailGateClient (API key + Bearer auth)
    │       ├── types.ts       # Shared types
    │       └── resources/     # auth, emails, drafts, rules, api-keys, accounts
    └── ui/                    # @mailgate/ui — Shared React components
        └── src/               # Button, Input, Card, Badge, UsageBar
```

## Database Tables

- `users` — Auth, inboxrulesTier, dashboardTier, dual Stripe customer IDs
- `gmail_accounts` — OAuth tokens, watch expiry, history ID
- `emails` — Full email data + AI classification (category, priority, summary, entities)
- `drafts` — AI-generated reply drafts, approval status
- `rules` — User-defined automation rules (conditions → actions)
- `filtering_rules` — Enhanced filtering (domain, regex, keywords → classify/archive/mark_read)
- `api_keys` — API key hashes, permissions, quotas, expiry
- `audit_logs` — API request audit trail
- `subscriptions` — Stripe subscription tracking (dual products)

## Key API Endpoints

All routes available at both `/api/*` (legacy) and `/v1/*` (versioned).

```
# Auth
POST   /v1/auth/signup               # Create account
POST   /v1/auth/login                # Login → JWT
GET    /v1/auth/me                   # Current user
GET    /v1/auth/gmail/connect        # Start Gmail OAuth
GET    /v1/auth/gmail/callback       # Gmail OAuth callback
GET    /v1/auth/gmail/accounts       # List connected accounts
DELETE /v1/auth/gmail/accounts/:id   # Disconnect account

# Emails
GET    /v1/emails                    # List (paginated, filterable, searchable)
GET    /v1/emails/:id                # Get single + mark read
PATCH  /v1/emails/:id/archive        # Archive
GET    /v1/emails/stats/overview     # Category stats + unread count

# Drafts
POST   /v1/drafts/generate           # Queue AI draft generation
GET    /v1/drafts                    # List pending drafts
GET    /v1/drafts/:id                # Get draft
PATCH  /v1/drafts/:id                # Edit draft content
POST   /v1/drafts/:id/send           # Approve + send
DELETE /v1/drafts/:id                # Delete draft

# Rules
GET    /v1/rules                     # List automation rules
POST   /v1/rules                     # Create rule
PUT    /v1/rules/:id                 # Update rule
DELETE /v1/rules/:id                 # Delete rule

# Filtering Rules
GET    /v1/filtering-rules           # List filtering rules
POST   /v1/filtering-rules           # Create filtering rule
PUT    /v1/filtering-rules/:id       # Update filtering rule
DELETE /v1/filtering-rules/:id       # Delete filtering rule

# API Keys
GET    /v1/api-keys                  # List API keys
POST   /v1/api-keys                  # Create API key (returns raw key once)
GET    /v1/api-keys/:id              # Get API key details
DELETE /v1/api-keys/:id              # Revoke API key

# Audit
GET    /v1/audit                     # List audit logs (paginated, filterable)

# Payments
POST   /v1/payments/checkout         # Create Stripe checkout
POST   /v1/payments/portal           # Stripe billing portal
GET    /v1/payments/subscription     # Get subscription status

# Real-time
GET    /v1/events/stream?token=...   # SSE real-time events

# Webhooks
POST   /webhooks/gmail               # Gmail Pub/Sub push
POST   /webhooks/stripe              # Stripe events
```

## Authentication

Two auth methods (middleware tries API key first, falls back to JWT):

1. **JWT Bearer** — Used by Inboxrules and Dashboard frontends
   ```
   Authorization: Bearer <jwt_token>
   ```

2. **API Key** — Used by external integrations and SDK
   ```
   X-API-Key: mg_live_<random>
   ```
   API keys have configurable permissions: `canRead`, `canWrite`, `canDelete`

## Email Processing Pipeline

```
Gmail Webhook → emailQueue (fetch)
  → classifyQueue:
    1. Rule-based filtering (free, all tiers)
    2. AI classification (GPT-4o-mini, paid tiers only)
    3. Leave uncategorized (free tier, no rule match)
  → rules engine (user automation rules)
  → draftQueue (GPT-4o, if auto-reply enabled)
  → SSE notify
```

## Pricing Tiers

### Inboxrules (Consumer)

| Tier | Price | Accounts | Emails/mo | Drafts/mo |
|------|-------|----------|-----------|-----------|
| Free | $0 | 1 | 100 | 10 |
| Pro | $15/mo | 3 | 1,000 | 100 |
| Team | $50/mo | 10 | 10,000 | Unlimited |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

### Dashboard (API/Developer)

| Tier | AI Classification |
|------|-------------------|
| Free | No (rule-based only) |
| Pro | Yes |
| Team | Yes |
| Enterprise | Yes |

## Conventions

- All code is TypeScript (strict mode)
- Zod for all input validation
- Drizzle ORM for all DB queries (no raw SQL)
- BullMQ for all background jobs
- Dual auth: API key (X-API-Key) + JWT Bearer on all /v1/* routes
- Hono route groups per domain
- Workers run as separate processes
- pnpm for package management
- Turborepo for monorepo orchestration

## Development Commands

```bash
# Root (monorepo)
pnpm install                          # Install all dependencies
pnpm dev                              # Start all apps
pnpm dev --filter=@mailgate/api       # Start API only (port 3005)
pnpm dev --filter=@mailgate/inboxrules # Start Inboxrules only (port 3004)
pnpm dev --filter=@mailgate/dashboard # Start Dashboard only (port 3006)
pnpm build                            # Build all apps
pnpm typecheck                        # Type check all packages

# Database
pnpm --filter=@mailgate/api db:push   # Push schema to DB
pnpm --filter=@mailgate/api db:generate # Generate migrations

# Infrastructure
docker-compose up -d                  # Start PostgreSQL + Redis (dev)
docker-compose -f docker-compose.prod.yml up -d  # Start all (prod)
```

---

## Implementation Progress

### Monorepo Migration — COMPLETE
- [x] Turborepo + pnpm workspace scaffolding
- [x] Backend moved to apps/api/
- [x] Frontend moved to apps/inboxrules/ (rebranded to Inboxrules)
- [x] Shared packages: config, ui, sdk
- [x] @mailgate/sdk with typed resource classes
- [x] Inboxrules api.ts replaced with SDK-backed wrapper

### Database Additions — COMPLETE
- [x] users table: inboxrulesTier, dashboardTier, dual Stripe IDs
- [x] api_keys table (hash, prefix, permissions, quota)
- [x] audit_logs table
- [x] filtering_rules table (domain, regex, keyword conditions)
- [x] subscriptions: product field for dual billing

### API Key Auth + Permissions — COMPLETE
- [x] Dual auth middleware (API key first, JWT fallback)
- [x] Permission-based access control (canRead/canWrite/canDelete)
- [x] API key CRUD routes
- [x] Audit logging middleware
- [x] Audit log viewer route
- [x] API versioning (/v1/ prefix, /api/ legacy)

### Dashboard App — COMPLETE
- [x] Next.js 14 developer portal (apps/dashboard)
- [x] API key management UI
- [x] Filtering rules builder
- [x] Usage dashboard
- [x] Audit log viewer
- [x] Billing integration

### Hybrid Filtering Engine — COMPLETE
- [x] Rule-based filtering (free for all tiers)
- [x] AI classification gated by tier
- [x] Classifier worker: rules first → AI fallback → uncategorized

### Inboxrules Rebrand — COMPLETE
- [x] All "AI Mail Agent" → "Inboxrules" branding
- [x] Layout, navbar, landing page, login, signup updated

### Deferred
- [ ] Monitoring (Langfuse, Sentry) — add when deploying
- [ ] Dual billing checkout (separate Stripe products per app)
- [ ] PII filtering for API responses
- [ ] OpenClaw agent routing
