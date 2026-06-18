# Al-Wasl Digital WAHO Top-Up

Production-oriented Next.js 15 application for WAHO account top-ups.

The app is now full-stack:

- PostgreSQL + Prisma for users, sessions, products, packages, orders, payment attempts, wallet transactions, provider requests, and admin audit logs.
- OTP auth with httpOnly session cookies.
- Server-side WAHO product catalog and order creation.
- Fake payments that are still stored and confirmed server-side.
- Wallet ledger updates through database transactions.
- WAHO provider abstraction with a mock adapter until the real WAHO API is available.

## Setup

```bash
bun install
cp .env.example .env
```

Set `DATABASE_URL`, `SESSION_SECRET`, and `OTP_PEPPER` in `.env`.

For local development with PostgreSQL:

```bash
bun run db:push
bun run db:seed
bun run dev
```

The seeded admin/demo account uses:

- Phone: `+9647812345678`
- OTP: `123456`

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
```

## Environment Variables

See `.env.example`.

Important production variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `OTP_PEPPER`
- `OTP_WEBHOOK_URL`
- `OTP_WEBHOOK_TOKEN`
- `SEED_ADMIN_PHONE`
- `WAHO_API_BASE_URL`
- `WAHO_API_KEY`
- `PAYMENT_MODE=fake`

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

Payments are intentionally fake for now. Do not connect live payment providers until the business flow and reconciliation process are approved.
