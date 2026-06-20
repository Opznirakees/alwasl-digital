# Contract Deliverables

This register makes the project deliverables explicit and auditable in the repository. It is operational documentation for the Al-Wasl Digital WAHO top-up application and can be referenced from the commercial agreement.

## Deliverable Register

| ID | Deliverable | Evidence in repo | Acceptance signal |
| --- | --- | --- | --- |
| D1 | Production-ready WAHO top-up web application | `src/app`, `src/components`, `src/server` | `bun run build` passes and customer top-up journey renders. |
| D2 | PostgreSQL and Prisma data model | `prisma/schema.prisma`, `prisma/migrations` | `bun run db:migrate` succeeds against production database. |
| D3 | Authentication, sessions, OTP, and sensitive action OTP | `src/app/api/auth`, `src/server/sensitive-otp.ts` | Login, session lookup, logout, and sensitive OTP checks pass. |
| D4 | WAHO product catalog, order flow, wallet ledger, and manual deposit flow | `src/app/api/products`, `src/app/api/orders`, `src/app/api/wallet` | E2E smoke covers product list, order creation guards, wallet and manual deposit paths. |
| D5 | Provider abstraction, retries, low-balance alerts, and WhatsApp notifications | `src/server/providers`, `src/server/services/provider-*`, `src/server/services/whatsapp-notifications.ts` | Backend tests cover failover, retry policy, low-balance checks, and notification hooks. |
| D6 | Admin dashboard and operational controls | `src/app/admin`, `src/app/api/admin` | Admin summary, CRUD routes, exports, reports, user blocking, and permissions are covered by tests. |
| D7 | Reporting and Excel export | `src/app/api/admin/reports`, `src/server/services/reports.ts` | Reporting tests and E2E admin report smoke pass. |
| D8 | Security and production hardening | `next.config.js`, `src/server/http.ts`, `.env.example`, `.github/workflows/ci.yml` | Security headers, safe errors, production-safe defaults, CI and tests pass. |
| D9 | Mobile/native API contract | `docs/openapi.yaml`, `docs/mobile-api-contract.md` | OpenAPI contract test passes. |
| D10 | Backup and restore runbook | `docs/database-backups.md`, `scripts/verify-digitalocean-backups.ts` | Backup operations test passes and `ops:check-backups` can verify live cluster backups. |
| D11 | Timeline, milestones, support/warranty, and handover documentation | `docs/project-timeline.md`, `docs/support-warranty.md`, `docs/handover.md` | Contract deliverables test passes. |
| D12 | Technical ownership and account custody evidence | `docs/technical-ownership.md`, `scripts/verify-operational-ownership.ts` | Ownership documentation test passes and `ops:check-ownership` can verify configured technical signals. |
| D13 | WAHO-first catalog scope and expansion policy | `docs/scope-deviations.md` | Scope test passes and WAHO-first catalog controls are documented. |

## Formal Acceptance Package

At handover, the acceptance package should include:

- Git commit SHA and branch name.
- Production URL and admin URL.
- Database cluster identifier and backup verification result.
- Customer ownership/custody confirmation for GitHub, DigitalOcean, domain/DNS, WAHA/WhatsApp, API keys, and production secrets.
- Environment variable checklist confirmation.
- `bun run build` result.
- `bun test tests` result.
- `bun run test:e2e` result.
- Known limitations and deferred items.
- WAHO-first catalog scope, including inactive-by-default expansion controls.
- Signed acceptance date.

The signed acceptance date starts the six-month support and warranty period defined in `docs/support-warranty.md`.

## Known Deferred Items

The following are intentionally not acceptance blockers unless added to the commercial agreement:

- Real payment provider integration.
- Native WAHO API integration if the external WAHO API contract is not provided.
- Native iOS/Android application builds.
- Public activation of non-WAHO products before provider routing, pricing, support process, translations, and QA are approved.
- Third-party provider outages or policy changes.
- Content, translations, or marketing assets not supplied before acceptance.

## Change Control

After acceptance, changes that alter scope, add payment providers, add native app builds, change WAHO provider behavior, or require new compliance obligations should be handled as a change request with:

- Requested change description.
- Business reason.
- Impact on timeline.
- Impact on support/warranty.
- Acceptance criteria.
- Approval from both parties.
