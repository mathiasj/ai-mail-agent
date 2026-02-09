# AI Mail Agent

AI-powered email assistant SaaS. Connect your Gmail, let AI classify, summarize, and draft replies. You stay in control.

## Features

- **Multi-account Gmail** — Manage personal + work emails in one place
- **AI Triage** — Automatic classification, priority scoring, summarization
- **Smart Drafts** — AI drafts replies, you approve before sending
- **Rules Engine** — Custom automation rules (if-then logic)
- **Real-time** — Live inbox updates via Server-Sent Events
- **Subscriptions** — Free, Pro ($15/mo), Team ($50/mo) tiers via Stripe

## Tech Stack

- **Runtime:** Bun
- **Backend:** Hono (TypeScript)
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Queue:** BullMQ + Redis 7
- **AI:** OpenAI GPT-4o / GPT-4o-mini
- **Email:** Gmail API + Pub/Sub webhooks
- **Auth:** JWT + Google OAuth 2.0
- **Payments:** Stripe
- **Frontend:** Next.js 14 + React + TailwindCSS

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Docker](https://www.docker.com/) (for PostgreSQL + Redis)
- Google Cloud project with Gmail API enabled
- OpenAI API key
- Stripe account (for payments)

### Setup

```bash
# Clone
git clone https://github.com/mathiasj/ai-mail-agent.git
cd ai-mail-agent

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start infrastructure
docker-compose up -d

# Run database migrations
bun run db:push

# Start the API server
bun run dev

# Start background workers (separate terminal)
bun run worker:all

# Start frontend (separate terminal)
cd frontend
bun install
bun run dev
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

## Service Setup

### Gmail OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Gmail API**:
   - Navigate to **APIs & Services → Library**
   - Search for "Gmail API" and click **Enable**
4. Configure the OAuth consent screen:
   - Go to **APIs & Services → OAuth consent screen**
   - Choose **External** user type
   - Fill in app name, support email, and developer contact
   - Add scopes: `gmail.readonly`, `gmail.send`, `gmail.compose`
   - Add test users (your Gmail addresses) while in testing mode
5. Create OAuth credentials:
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
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

1. Enable the **Cloud Pub/Sub API** in your Google Cloud project:
   - Navigate to **APIs & Services → Library**
   - Search for "Cloud Pub/Sub API" and click **Enable**
2. Create a Pub/Sub topic:
   - Go to **Pub/Sub → Topics**
   - Click **Create Topic**
   - Topic ID: `gmail-push`
   - Note the full topic name: `projects/YOUR_PROJECT_ID/topics/gmail-push`
3. Grant Gmail publish permissions:
   - On the topic page, click **Show Info Panel → Permissions**
   - Click **Add Principal**
   - Principal: `gmail-api-push@system.gserviceaccount.com`
   - Role: **Pub/Sub Publisher**
4. Create a subscription:
   - Go to **Pub/Sub → Subscriptions**
   - Click **Create Subscription**
   - Subscription ID: `gmail-push-sub`
   - Select the `gmail-push` topic
   - Delivery type: **Push**
   - Endpoint URL: `https://YOUR_DOMAIN/webhooks/gmail` (must be HTTPS — use [ngrok](https://ngrok.com/) for local dev: `ngrok http 3005`)
5. Update `.env`:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GMAIL_PUBSUB_TOPIC=projects/your-project-id/topics/gmail-push
   ```

> **Local development:** Since Pub/Sub requires a public HTTPS endpoint, run `ngrok http 3005` and use the ngrok URL as the push endpoint. Without this, email processing still works — you just won't get real-time push notifications and will need to trigger email fetching manually.

### Stripe (Payments)

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys:
   - Go to **Developers → API keys**
   - Copy the **Secret key** (starts with `sk_test_`)
3. Create products and prices:
   - Go to **Products → Add product**
   - Create **Pro** plan: $15/month recurring → copy the Price ID (`price_xxx`)
   - Create **Team** plan: $50/month recurring → copy the Price ID (`price_yyy`)
4. Set up webhooks:
   - Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - Endpoint URL: `https://YOUR_DOMAIN/webhooks/stripe` (use ngrok for local dev)
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (starts with `whsec_`)
5. Update `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO=price_xxx
   STRIPE_PRICE_TEAM=price_yyy
   ```

> **Local development:** Run `stripe listen --forward-to localhost:3005/webhooks/stripe` using the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhook events locally. This also prints a webhook signing secret to use in your `.env`.

## Architecture

```
Gmail Pub/Sub → Webhook → Email Fetcher → Classifier (GPT-4o-mini) → Rules Engine → Draft Generator (GPT-4o)
                                                                                          ↓
                                                                              SSE → Frontend Inbox
```

### Email Processing Pipeline

1. **Webhook** — Gmail sends push notification when new email arrives
2. **Fetch** — Worker fetches full message via Gmail API
3. **Classify** — GPT-4o-mini assigns category, priority (1-10), summary, entities
4. **Rules** — User-defined rules execute (auto-reply, archive, classify override)
5. **Draft** — If triggered, GPT-4o generates a reply draft
6. **Notify** — SSE pushes update to connected frontend clients

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

All authenticated endpoints require `Authorization: Bearer <token>` header.

### Auth
- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `GET /api/auth/gmail/connect` — Start Gmail OAuth flow
- `GET /api/auth/gmail/accounts` — List connected Gmail accounts

### Emails
- `GET /api/emails` — List emails (paginated, filterable by category/account/search)
- `GET /api/emails/:id` — Get email details
- `PATCH /api/emails/:id/archive` — Archive email
- `GET /api/emails/stats/overview` — Category breakdown + unread count

### Drafts
- `POST /api/drafts/generate` — Generate AI draft for an email
- `GET /api/drafts` — List pending drafts
- `PATCH /api/drafts/:id` — Edit draft content
- `POST /api/drafts/:id/send` — Approve and send

### Rules
- `GET /api/rules` — List rules
- `POST /api/rules` — Create rule
- `PUT /api/rules/:id` — Update rule
- `PATCH /api/rules/:id/toggle` — Enable/disable

### Payments
- `POST /api/payments/checkout` — Create Stripe checkout session
- `POST /api/payments/portal` — Open Stripe billing portal
- `GET /api/payments/subscription` — Get subscription status

### Real-time
- `GET /api/events/stream?token=...` — SSE stream for live updates

## Testing

The API backend has a comprehensive test suite using `bun test` (built-in, zero external deps).

```bash
# Run all tests (monorepo-wide via Turborepo)
pnpm test

# Run API tests directly
cd apps/api && bun test

# Watch mode during development
cd apps/api && bun test --watch

# Run a specific test file
cd apps/api && bun test src/core/email-parser.test.ts
```

Tests are organized by layer:
- `src/core/*.test.ts` — Pure business logic (email parsing, filtering, rules, usage limits, auto-reply safety)
- `src/auth/*.test.ts` — JWT signing/verification, auth middleware
- `src/api/middleware/*.test.ts` — Permission checks
- `src/api/routes/*.test.ts` — Route integration tests (mocked DB)
- `src/workers/*.test.ts` — Worker logic (mocked DB + OpenAI)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests (monorepo-wide) |
| `bun run dev` | Start API server (port 3000) |
| `bun run worker:all` | Start all background workers |
| `bun run worker:email` | Start email fetcher worker only |
| `bun run worker:classify` | Start classifier worker only |
| `bun run worker:draft` | Start draft generator worker only |
| `bun run db:generate` | Generate migration SQL |
| `bun run db:push` | Push schema directly to DB |
| `bun run db:studio` | Open Drizzle Studio (DB browser) |
| `bun run typecheck` | TypeScript type check |
| `bun test` | Run API tests directly |

## Pricing

| Tier | Price | Gmail Accounts | Emails/mo | AI Drafts/mo |
|------|-------|----------------|-----------|--------------|
| Free | $0 | 1 | 100 | 10 |
| Pro | $15/mo | 3 | 1,000 | 100 |
| Team | $50/mo | 10 | 10,000 | Unlimited |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

## License

Private — All rights reserved.
