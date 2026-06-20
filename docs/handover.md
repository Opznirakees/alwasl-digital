# Handover Documentation

This handover checklist is used when transferring the Al-Wasl Digital WAHO top-up application to the operator or maintenance team.

## Repository

- Repository: `alwasl-digital`
- Runtime: Next.js 15, Bun, PostgreSQL, Prisma.
- Main application code: `src/app`, `src/components`, `src/server`.
- Prisma schema and migrations: `prisma/schema.prisma`, `prisma/migrations`.
- Tests: `tests/backend.test.ts`, `e2e/app.spec.ts`.
- CI: `.github/workflows/ci.yml`.

## Required Access

Transfer through a secure channel:

- GitHub repository access.
- DigitalOcean App Platform access.
- DigitalOcean managed PostgreSQL access.
- WAHA service access.
- WhatsApp operator number or WAHA session ownership.
- Production admin account phone number.
- Domain/DNS access if the production URL is custom.

Do not store production secrets in the repository.

## Technical Ownership Verification

Production assets should be owned by customer-controlled accounts. Use `docs/technical-ownership.md` as the ownership checklist and run the machine-checkable verification when the required identifiers are configured:

```bash
bun run ops:check-ownership
```

This command can verify account/resource visibility, but it cannot prove legal ownership of external accounts or API keys. Legal ownership and API-key custody must be confirmed in the handover sign-off.

## Environment Variables

Use `.env.example` as the checklist. Production must set at least:

- `DATABASE_URL`
- `OTP_PEPPER`
- `CRON_SECRET`
- `WAHA_BASE_URL`
- `WAHA_API_KEY`
- `WAHA_SESSION`
- `WAHO_FULFILLMENT_PHONE`
- `DO_APP_ID`
- `DO_DATABASE_CLUSTER_ID`
- `BACKUP_MAX_AGE_HOURS`
- `OWNERSHIP_CUSTOMER_LEGAL_NAME`
- `OWNERSHIP_EXPECTED_DIGITALOCEAN_ACCOUNT_EMAIL`
- `OWNERSHIP_EXPECTED_GITHUB_OWNER`
- `OWNERSHIP_CUSTOMER_DOMAIN`
- `OWNERSHIP_EXPECTED_DOMAIN_TARGET`

Optional production variables:

- `OTP_WEBHOOK_URL`
- `OTP_WEBHOOK_TOKEN`
- `WAHO_API_BASE_URL`
- `WAHO_API_KEY`
- `PROVIDER_ALERT_WHATSAPP_PHONE`

Local-only variables must remain disabled in production:

- `ENABLE_DEMO_AUTH`
- `ENABLE_FAKE_PAYMENTS`
- `ENABLE_MOCK_WAHO`

## Deployment Commands

```bash
bun install
bun run db:migrate
bun run db:seed
bun run build
bun run start
```

DigitalOcean App Platform should run the build and start commands defined in `README.md`.

## Scheduled Jobs

Configure scheduled requests with `Authorization: Bearer $CRON_SECRET`:

```bash
https://YOUR_APP_URL/api/jobs/provider-retries
https://YOUR_APP_URL/api/jobs/provider-alerts
```

Provider retries should run at least once per minute. Provider alert checks may run every few minutes.

## Smoke Test After Deployment

Run:

```bash
bun run test:e2e
```

Manual verification:

- Home page loads.
- Language and theme controls work on mobile.
- WAHO product list shows the WAHO top-up launch product.
- Catalog scope record confirms WAHO is the launch focus and future products are inactive until approved.
- Login OTP can be delivered through configured provider.
- Wallet page loads for a logged-in user.
- Admin dashboard loads for an authorized admin/staff user.
- Reports and Excel exports are available to permitted users.
- Backup check can be run with `bun run ops:check-backups`.

## Operations References

- Mobile API contract: `docs/openapi.yaml`
- Native app notes: `docs/mobile-api-contract.md`
- Database backup runbook: `docs/database-backups.md`
- Technical ownership runbook: `docs/technical-ownership.md`
- WAHO-first catalog scope: `docs/scope-deviations.md`
- Timeline and milestones: `docs/project-timeline.md`
- Support and warranty: `docs/support-warranty.md`
- Contract deliverables: `docs/contract-deliverables.md`

## Handover Sign-Off

Record at handover:

- Handover date:
- Production URL:
- Git commit SHA:
- DigitalOcean app ID:
- Database cluster ID:
- GitHub owner:
- Domain/DNS owner:
- WAHA/WhatsApp owner:
- WAHO API credential owner:
- Payment provider credential owner:
- Backup verification timestamp:
- Ownership verification timestamp:
- Admin phone transferred:
- Known deferred items:
- WAHO-first catalog scope confirmed:
- Receiving operator:
- Delivering maintainer:
