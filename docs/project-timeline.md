# Project Timeline and Milestones

This timeline documents the intended delivery sequence for the Al-Wasl Digital WAHO top-up application. Dates are relative to project start or formal acceptance when exact calendar dates are not part of the repository.

## Milestone Summary

| Milestone | Target window | Scope | Acceptance criteria |
| --- | --- | --- | --- |
| M1 Discovery and scope lock | Week 1 | WAHO-only top-up scope, supported languages, production constraints, DigitalOcean target, visual direction. | Scope list approved and unrelated WAHO games/products excluded. |
| M2 Frontend experience | Weeks 1-2 | WAHO-focused landing, top-up journey, mobile responsive UI, dark theme, translations. | Mobile and desktop UI smoke tests pass; visible copy is WAHO top-up focused. |
| M3 Full-stack foundation | Weeks 2-3 | PostgreSQL, Prisma schema, auth, sessions, orders, wallet ledger, seed data. | `bun run db:migrate`, `bun run db:seed`, `bun run build`, and backend tests pass. |
| M4 Production hardening | Weeks 3-4 | Security headers, safe error handling, production-safe defaults, rate limits, idempotency, role checks. | Security and configuration tests pass; production demo/fake flows are locked down. |
| M5 Operations and admin | Weeks 4-5 | Admin dashboard, CRUD, customer blocking, reporting, exports, audit logs. | Admin E2E smoke and backend admin contract tests pass. |
| M6 Provider operations | Weeks 5-6 | WAHO provider abstraction, WAHA WhatsApp bridge, retries, low-balance alerts, notifications. | Provider retry, alert and notification tests pass; real WAHO API remains replaceable behind provider interface. |
| M7 Production deployment | Week 6 | DigitalOcean app, managed PostgreSQL, env variables, migrations, seed, scheduled jobs. | Production URL loads, database connected, admin login works, backup check can be run. |
| M8 Handover and acceptance | Week 6 | Handover docs, OpenAPI contract, backup runbook, support/warranty start. | Acceptance package is complete and acceptance date is recorded. |

## Acceptance Gate

Formal acceptance requires:

- Production environment configured with managed PostgreSQL.
- Production build passing.
- Backend tests passing.
- E2E smoke passing.
- Backup verification procedure documented and ready to run with the production cluster ID.
- Admin credentials and operational notes handed over through a secure channel.
- Known deferred items listed in `docs/contract-deliverables.md`.
- Accepted PDF scope deviations listed in `docs/scope-deviations.md`.

## Post-Acceptance Support Timeline

The support and warranty period runs for six months from the signed acceptance date:

- Month 1: stabilization, critical bug fixes, production handover questions.
- Months 2-3: normal warranty support for defects in accepted scope.
- Months 4-6: warranty support for reproducible defects and reasonable operational questions.

New features and third-party provider changes are handled through change control, not warranty.
