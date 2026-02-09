# MailGate.ai + Inboxrules

Dual-product Turborepo monorepo:

- **MailGate.ai** — B2B email API infrastructure for AI agents (developer portal)
- **Inboxrules** — B2C consumer email client (built on MailGate.ai API)

Shared backend powers both products. Connect Gmail accounts, classify with AI or rules, generate drafts, dispatch webhooks, and stream events in real-time.

## Features

- **Multi-account Gmail** — Connect personal + work accounts via OAuth
- **Hybrid Classification** — Rule-based filtering (free) + AI classification via GPT-4o-mini (paid)
- **Smart Drafts** — GPT-4o generates reply drafts, you approve before sending
- **Rules Engine** — Custom automation rules (if-then) + filtering rules (domain, regex, keywords)
- **Real-time SSE** — Live event stream for new emails, classifications, and drafts
- **Webhook Dispatch** — HTTP POST callbacks with HMAC-SHA256 signatures on rule matches
- **SSE Token Exchange** — Short-lived tokens for secure agent connections
- **API Key Auth** — Scoped keys with granular read/write/delete permissions
- **Audit Logging** — Full trail of every API call
- **Subscriptions** — Free, Pro ($15/mo), Team ($50/mo) tiers via Stripe (dual billing)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Runtime | Bun |
| Backend | Hono (TypeScript) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Queue | BullMQ + Redis 7 |
| AI/LLM | OpenAI GPT-4o (drafts), GPT-4o-mini (classification) |
| Email | Gmail API + Pub/Sub webhooks |
| Auth | JWT (jose) + Google OAuth 2.0 + API Keys (X-API-Key) |
| Payments | Stripe (dual subscriptions) |
| Frontend | Next.js 14 + React + TailwindCSS |
| SDK | @mailgate/sdk (shared TypeScript client) |
| Real-time | Server-Sent Events (SSE) |

## Project Structure

```
├── apps/
│   ├── api/          # @mailgate/api — Hono backend (port 3005)
│   ├── inboxrules/   # @mailgate/inboxrules — Consumer email client (port 3004)
│   └── dashboard/    # @mailgate/dashboard — Developer portal (port 3006)
├── packages/
│   ├── config/       # Shared tsconfigs + tailwind
│   ├── sdk/          # @mailgate/sdk — TypeScript API client
│   └── ui/           # Shared React components
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Docker](https://www.docker.com/) (for PostgreSQL + Redis)
- [pnpm](https://pnpm.io/) (package manager)
- Google Cloud project with Gmail API enabled
- OpenAI API key
- Stripe account (for payments)

### Setup

```bash
# Clone
git clone https://github.com/mathiasj/ai-mail-agent.git
cd ai-mail-agent

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start infrastructure
docker-compose up -d

# Push database schema
pnpm --filter=@mailgate/api db:push

# Start all apps
pnpm dev
```

### Environment Variables

See `.env.example` for all required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT signing (min 16 chars) |
| `GMAIL_CLIENT_ID` | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret |
| `GMAIL_REDIRECT_URI` | OAuth callback URL |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `WEBHOOK_SECRET` | HMAC secret for outbound webhook signatures |

## Architecture

```
Gmail Webhook → emailQueue (fetch) → SSE: new_email
  → classifyQueue:
    1. Rule-based filtering (free, all tiers) → SSE: email_classified + webhook dispatch
    2. AI classification (GPT-4o-mini, paid tiers only) → SSE: email_classified
    3. Leave uncategorized (free tier, no rule match)
  → rules engine (user automation rules)
  → draftQueue (GPT-4o, if auto-reply enabled) → SSE: draft_generated
```

### Email Processing Pipeline

1. **Webhook** — Gmail sends push notification when new email arrives
2. **Fetch** — Worker fetches full message via Gmail API, emits `new_email` SSE event
3. **Classify** — Rule-based filtering first, then AI (GPT-4o-mini) for paid tiers. Emits `email_classified` SSE event. Dispatches webhook if configured on matching rule.
4. **Rules** — User-defined automation rules execute (auto-reply, archive, classify override)
5. **Draft** — If triggered, GPT-4o generates a reply draft, emits `draft_generated` SSE event

### Agent Integration

AI agents (e.g. OpenClaw) connect via two patterns:

**SSE (local agents, no public URL needed):**
```
POST /v1/auth/sse-token  (X-API-Key header) → short-lived JWT (1h)
GET  /v1/events/stream?token=<jwt>          → SSE stream
```

**Webhooks (cloud agents with public URL):**
- Configure webhook URL on a filtering rule
- HTTP POST with `X-MailGate-Signature` (HMAC-SHA256) + `X-MailGate-Event` header
- 3 retries with exponential backoff on 5xx

### Categories

| Category | Priority Range | Description |
|----------|---------------|-------------|
| action-required | 7-10 | Needs response or action |
| fyi | 4-6 | Informational only |
| meeting | 6-8 | Calendar invites |
| newsletter | 1-3 | Marketing, digests |
| automated | 2-4 | System notifications |
| spam | 0-1 | Unsolicited |

## API

All routes available at both `/api/*` (legacy) and `/v1/*` (versioned).

Two auth methods (middleware tries API key first, falls back to JWT):
- **JWT Bearer:** `Authorization: Bearer <token>` — used by frontends
- **API Key:** `X-API-Key: mg_live_<random>` — used by external integrations

### Auth
- `POST /v1/auth/signup` — Create account
- `POST /v1/auth/login` — Login
- `GET /v1/auth/me` — Current user
- `POST /v1/auth/sse-token` — Exchange API key for short-lived SSE token (1h)
- `GET /v1/auth/gmail/connect` — Start Gmail OAuth flow
- `GET /v1/auth/gmail/callback` — Gmail OAuth callback
- `GET /v1/auth/gmail/accounts` — List connected Gmail accounts
- `DELETE /v1/auth/gmail/accounts/:id` — Disconnect account

### Emails
- `GET /v1/emails` — List emails (paginated, filterable by category/account/search)
- `GET /v1/emails/:id` — Get email details + mark read
- `PATCH /v1/emails/:id/archive` — Archive email
- `GET /v1/emails/stats/overview` — Category breakdown + unread count

### Drafts
- `POST /v1/drafts/generate` — Queue AI draft generation
- `GET /v1/drafts` — List pending drafts
- `GET /v1/drafts/:id` — Get draft
- `PATCH /v1/drafts/:id` — Edit draft content
- `POST /v1/drafts/:id/send` — Approve and send
- `DELETE /v1/drafts/:id` — Delete draft

### Rules
- `GET /v1/rules` — List automation rules
- `POST /v1/rules` — Create rule
- `PUT /v1/rules/:id` — Update rule
- `DELETE /v1/rules/:id` — Delete rule

### Filtering Rules
- `GET /v1/filtering-rules` — List filtering rules
- `POST /v1/filtering-rules` — Create filtering rule (supports webhook URL in actions)
- `PUT /v1/filtering-rules/:id` — Update filtering rule
- `DELETE /v1/filtering-rules/:id` — Delete filtering rule

### API Keys
- `GET /v1/api-keys` — List API keys
- `POST /v1/api-keys` — Create API key (returns raw key once)
- `GET /v1/api-keys/:id` — Get API key details
- `DELETE /v1/api-keys/:id` — Revoke API key

### Audit
- `GET /v1/audit` — List audit logs (paginated, filterable)

### Payments
- `POST /v1/payments/checkout` — Create Stripe checkout session
- `POST /v1/payments/portal` — Open Stripe billing portal
- `GET /v1/payments/subscription` — Get subscription status

### Real-time
- `GET /v1/events/stream?token=...` — SSE stream (events: `new_email`, `email_classified`, `draft_generated`, `heartbeat`)

### Webhooks
- `POST /webhooks/gmail` — Gmail Pub/Sub push
- `POST /webhooks/stripe` — Stripe events

## Service Setup

### Gmail OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Gmail API**:
   - Navigate to **APIs & Services > Library**
   - Search for "Gmail API" and click **Enable**
4. Configure the OAuth consent screen:
   - Go to **APIs & Services > OAuth consent screen**
   - Choose **External** user type
   - Fill in app name, support email, and developer contact
   - Add scopes: `gmail.readonly`, `gmail.send`, `gmail.compose`
   - Add test users (your Gmail addresses) while in testing mode
5. Create OAuth credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Add authorized redirect URI: `http://localhost:3005/api/auth/gmail/callback`
   - Copy the **Client ID** and **Client Secret**
6. Update `.env`:
   ```
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-client-secret
   GMAIL_REDIRECT_URI=http://localhost:3005/api/auth/gmail/callback
   ```

### Google Cloud Pub/Sub (Gmail Webhooks)

Gmail uses Pub/Sub to push real-time notifications when new emails arrive.

1. Enable the **Cloud Pub/Sub API** in your Google Cloud project
2. Create a Pub/Sub topic: `gmail-push`
3. Grant Gmail publish permissions:
   - Principal: `gmail-api-push@system.gserviceaccount.com`
   - Role: **Pub/Sub Publisher**
4. Create a push subscription pointing to `https://YOUR_DOMAIN/webhooks/gmail`
5. Update `.env`:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GMAIL_PUBSUB_TOPIC=projects/your-project-id/topics/gmail-push
   ```

> **Local development:** Run `ngrok http 3005` and use the ngrok URL as the push endpoint.

### Stripe (Payments)

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your **Secret key** (starts with `sk_test_`)
3. Create **Pro** ($15/mo) and **Team** ($50/mo) price IDs
4. Set up webhooks to `https://YOUR_DOMAIN/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Update `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO=price_xxx
   STRIPE_PRICE_TEAM=price_yyy
   ```

> **Local development:** Run `stripe listen --forward-to localhost:3005/webhooks/stripe`

## Testing

```bash
# Run all tests (monorepo-wide)
pnpm test

# Run API tests directly
cd apps/api && bun test

# Watch mode
cd apps/api && bun test --watch

# Specific directory
cd apps/api && bun test src/core/
```

Tests are organized by layer:
- `src/core/*.test.ts` — Business logic (email parsing, filtering, rules, usage limits, webhook dispatch)
- `src/auth/*.test.ts` — JWT signing/verification, auth middleware
- `src/api/middleware/*.test.ts` — Permission checks
- `src/api/routes/*.test.ts` — Route integration tests (mocked DB)
- `src/workers/*.test.ts` — Worker logic (mocked DB + OpenAI)

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
pnpm test                             # Run all tests

# Database
pnpm --filter=@mailgate/api db:push   # Push schema to DB
pnpm --filter=@mailgate/api db:generate # Generate migrations

# Infrastructure
docker-compose up -d                  # Start PostgreSQL + Redis (dev)
docker-compose -f docker-compose.prod.yml up -d  # Start all (prod)
```

## Pricing

### Inboxrules (Consumer)

| Tier | Price | Gmail Accounts | Emails/mo | AI Drafts/mo |
|------|-------|----------------|-----------|--------------|
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

## License

Private — All rights reserved.
