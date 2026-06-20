# Support and Warranty

This document defines the operational support and warranty expectations for the accepted Al-Wasl Digital WAHO top-up application.

## Support Period

The included support and warranty period is six months from the signed production acceptance date.

Record these values at acceptance:

- Acceptance date:
- Production URL:
- Git commit SHA:
- Database cluster ID:
- Primary operator contact:
- Technical maintainer contact:

## Warranty Coverage

Covered during the six-month warranty period:

- Reproducible defects in accepted application scope.
- Regressions in documented WAHO top-up, auth, wallet, manual deposit, admin, reporting, and export flows.
- Fixes for server-side errors caused by code delivered in the accepted release.
- Clarification of handover documentation.
- Reasonable operational guidance for deployment, backups, scheduled jobs, and environment variables.

Not covered as warranty:

- New product features or UI redesigns.
- Real payment provider integration if not included in the accepted scope.
- Native app builds.
- External WAHO API changes or outages.
- WAHA, WhatsApp, DigitalOcean, payment provider, or third-party policy changes.
- Data correction caused by manual admin mistakes or incorrect transaction IDs.
- Security incidents caused by leaked credentials, disabled backups, or production environment changes outside the documented runbooks.

## Response Targets

These targets are operational expectations, not uptime guarantees:

| Priority | Definition | Target first response |
| --- | --- | --- |
| P0 | Production down, login unavailable, or top-up order flow blocked for all customers. | 1 business day |
| P1 | Major production defect affecting payments, wallet ledger, admin review, or order correctness. | 2 business days |
| P2 | Non-critical defect with workaround, copy issue, styling issue, or reporting/export issue. | 5 business days |

## Support Request Requirements

Each support request should include:

- Production URL or environment.
- User/account/order ID when relevant.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Screenshot or server log excerpt if available.
- Time the issue occurred.

## Fix Delivery

Warranty fixes should be delivered through the repository with:

- A clear commit message.
- A short change summary.
- Relevant regression test when practical.
- Build/test command results.
- Deployment note if production action is required.

## End of Warranty

At the end of the six-month period, ongoing support should continue only under a renewed maintenance agreement or a separate change request.
