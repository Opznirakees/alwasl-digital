# Al-Wasl Digital WAHO Top-Up

Production-oriented Next.js 15 application for WAHO account top-ups.

The app is now full-stack:

- PostgreSQL + Prisma for users, sessions, products, packages, orders, payment attempts, wallet transactions, providers, provider accounts, provider requests, and admin audit logs.
- OTP auth with httpOnly session cookies and direct WAHA WhatsApp delivery when configured.
- Action-scoped OTP challenges for WAHO order confirmation, payment confirmation, and wallet changes.
- Server-side WAHO product catalog and order creation.
- Payment adapters are intentionally closed in production until real providers are configured.
- WAHO fulfillment can send production requests through the WAHA WhatsApp bridge when configured.
- Wallet ledger updates through database transactions.
- WAHO provider registry with priority, fallback, account balance, local mock, WAHA WhatsApp fulfillment bridge, and native WAHO API placeholders.
- Provider low-balance alerts are stored for admins and can send WhatsApp alerts through WAHA when configured.
- Provider retry jobs persist failed fulfillment attempts, retry after 3 minutes, and stop after 3 attempts before final compensation.

## Setup

```bash
bun install
cp .env.example .env
```

Set `DATABASE_URL` and `OTP_PEPPER` in `.env`. Generate `OTP_PEPPER` with a strong random value, for example:

```bash
openssl rand -hex 32
```

For local development with PostgreSQL:

```bash
bun run db:push
bun run db:seed
bun run dev
```

The seeded admin account uses this phone number:

- Phone: `+9647812345678`

Local demo OTP login is disabled by default and ignored in production. Only enable it temporarily in local development with `ENABLE_DEMO_AUTH=true` and a custom `DEMO_OTP`.

## Commands

```bash
bun run dev          # local development
bun run build        # prisma generate + next build
bun run start        # production server
bun run db:generate  # regenerate Prisma client
bun run db:migrate   # apply production migrations
bun run db:push      # push schema in development
bun run db:seed      # seed WAHO product/packages and admin user
bun run test         # backend domain tests
bun run test:e2e     # Playwright browser/API smoke tests
bun run ops:check-backups # verify DigitalOcean managed database backups
bun run ops:check-ownership # verify machine-checkable ownership signals
```

## Mobile API Contract

Native app clients should use the formal OpenAPI contract in [`docs/openapi.yaml`](docs/openapi.yaml). Implementation notes for cookie auth, action-scoped OTP, idempotent order creation, and production behavior are in [`docs/mobile-api-contract.md`](docs/mobile-api-contract.md).

## Database Backups

Production must use managed PostgreSQL with automated cloud backups. The operational runbook is in [`docs/database-backups.md`](docs/database-backups.md). To verify DigitalOcean managed database backups, set `DO_DATABASE_CLUSTER_ID` and run:

```bash
bun run ops:check-backups
```

## Contract Deliverables

Contractual project evidence is documented in [`docs/contract-deliverables.md`](docs/contract-deliverables.md). Supporting handover documents are:

- [`docs/project-timeline.md`](docs/project-timeline.md)
- [`docs/support-warranty.md`](docs/support-warranty.md)
- [`docs/handover.md`](docs/handover.md)
- [`docs/technical-ownership.md`](docs/technical-ownership.md)
- [`docs/scope-deviations.md`](docs/scope-deviations.md)

Technical ownership of domain, server, provider accounts and API keys cannot be proven by source code alone. The ownership runbook defines required customer-owned assets and the machine-checkable verification command:

```bash
bun run ops:check-ownership
```

## Environment Variables

See `.env.example`.

Important production variables:

- `DATABASE_URL`
- `DO_APP_ID`
- `DO_DATABASE_CLUSTER_ID`
- `BACKUP_MAX_AGE_HOURS`
- `OWNERSHIP_CUSTOMER_LEGAL_NAME`
- `OWNERSHIP_EXPECTED_DIGITALOCEAN_ACCOUNT_EMAIL`
- `OWNERSHIP_EXPECTED_GITHUB_OWNER`
- `OWNERSHIP_CUSTOMER_DOMAIN`
- `OWNERSHIP_EXPECTED_DOMAIN_TARGET`
- `OTP_PEPPER`
- `WAHA_BASE_URL`
- `WAHA_API_KEY`
- `WAHA_SESSION`
- `OTP_WEBHOOK_URL` (optional fallback)
- `OTP_WEBHOOK_TOKEN` (optional fallback)
- `SEED_ADMIN_PHONE`
- `CRON_SECRET`
- `WAHO_API_BASE_URL`
- `WAHO_API_KEY`
- `WAHO_PROVIDER_INITIAL_BALANCE`
- `WAHO_PROVIDER_LOW_BALANCE_THRESHOLD`
- `PROVIDER_ALERT_WHATSAPP_PHONE`
- `WAHO_FULFILLMENT_PHONE`

## DigitalOcean Deployment Notes

1. Create or attach a managed PostgreSQL database.
2. Add the environment variables from `.env.example` to the App Platform component.
   For DigitalOcean managed PostgreSQL, keep SSL enabled and add `uselibpqcompat=true` to the URL, for example:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:25060/alwasl_digital?sslmode=require&uselibpqcompat=true&schema=public"
```

3. Run Prisma migrations before or during deployment:

```bash
bun run db:migrate
bun run db:seed
```

4. Build command:

```bash
bun run build
```

5. Run command:

```bash
bun run start
```

6. Configure a scheduled request for provider retries. Call this endpoint at least once per minute; due jobs only run when their `nextRunAt` has passed:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_APP_URL/api/jobs/provider-retries
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_APP_URL/api/jobs/provider-alerts
```

Payment remains unavailable in production until the real payment provider contract is implemented and approved. Configure `WAHA_BASE_URL`, `WAHA_API_KEY`, and `WAHA_SESSION` for direct WhatsApp OTP delivery. Native WAHO API fulfillment can still be added later; until then, add `WAHO_FULFILLMENT_PHONE` to route paid WAHO top-up requests to the operator WhatsApp queue. Provider accounts are seeded with priority/fallback metadata, an initial routing balance from `WAHO_PROVIDER_INITIAL_BALANCE`, and a low-balance threshold from `WAHO_PROVIDER_LOW_BALANCE_THRESHOLD`; set `PROVIDER_ALERT_WHATSAPP_PHONE` to receive WhatsApp alerts. Manage real operational balances carefully after seed. Do not enable local-only demo or fake payment flags in production.
