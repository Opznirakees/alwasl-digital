# Al-Wasl Digital WAHO Top-Up

Production-oriented Next.js 15 application for WAHO account top-ups.

The app is now full-stack:

- PostgreSQL + Prisma for users, sessions, products, packages, orders, payment attempts, wallet transactions, provider requests, and admin audit logs.
- OTP auth with httpOnly session cookies.
- Server-side WAHO product catalog and order creation.
- Payment and WAHO fulfillment adapters are intentionally closed in production until real providers are configured.
- Wallet ledger updates through database transactions.
- WAHO provider abstraction with a mock adapter until the real WAHO API is available.

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
```

## Environment Variables

See `.env.example`.

Important production variables:

- `DATABASE_URL`
- `OTP_PEPPER`
- `OTP_WEBHOOK_URL`
- `OTP_WEBHOOK_TOKEN`
- `SEED_ADMIN_PHONE`
- `WAHO_API_BASE_URL`
- `WAHO_API_KEY`

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

Payment and WAHO fulfillment remain unavailable in production until the real provider contracts are implemented and approved. Do not enable local-only demo or fake payment flags in production.
