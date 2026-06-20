# Technical Ownership and Account Custody

Technical ownership cannot be proven from source code alone. Domain ownership, server ownership, cloud account ownership, WhatsApp/WAHA ownership, and API-key custody live in external provider accounts. This document makes those requirements explicit and defines the evidence that must be collected during handover.

## Ownership Principle

Production assets must be owned by the customer or by accounts contractually controlled by the customer. Maintainers may receive delegated access, but they should not be the primary owner of production infrastructure, domains, production secrets, payment credentials, or API credentials.

## Required Customer-Owned Assets

| Asset | Required ownership state | Repo or operational evidence |
| --- | --- | --- |
| GitHub repository | Customer organization or customer-controlled account owns the repository. | GitHub owner/organization and admin access recorded at handover. |
| DigitalOcean account/team | Customer owns the team containing App Platform, database, alerts, and billing. | `doctl account get`, App ID, database cluster ID, team/billing screenshot or export. |
| Domain and DNS | Customer owns registrar account and DNS zone. | Registrar/DNS admin screenshot, domain zone export, DNS records. |
| PostgreSQL database | Customer-owned DigitalOcean managed database or equivalent managed service. | Database cluster ID, backup verification, trusted sources. |
| WAHA / WhatsApp sending account | Customer owns WAHA deployment/session and WhatsApp number. | WAHA base URL, session name, WhatsApp number ownership confirmation. |
| WAHO API credentials | Customer owns or is authorized for live WAHO API keys when provided. | Provider account name, creation date, key rotation record. |
| Payment provider credentials | Customer owns payment credentials when real payments are added. | Provider dashboard owner, merchant account, webhook secret rotation record. |
| Production admin account | Customer controls the primary admin phone number. | Admin phone recorded in handover and verified with OTP. |
| Secrets and environment variables | Customer-controlled secret store contains production secrets. | DigitalOcean env var checklist and secret rotation confirmation. |

## Machine-Verifiable Checks

Use the repository command below after setting the relevant ownership variables:

```bash
bun run ops:check-ownership
```

The command can check:

- Current DigitalOcean account email when `OWNERSHIP_EXPECTED_DIGITALOCEAN_ACCOUNT_EMAIL` is set.
- DigitalOcean App Platform access when `DO_APP_ID` is set.
- DigitalOcean database cluster access when `DO_DATABASE_CLUSTER_ID` is set.
- Git remote owner when `OWNERSHIP_EXPECTED_GITHUB_OWNER` is set.
- DNS visibility and optional target matching when `OWNERSHIP_CUSTOMER_DOMAIN` and `OWNERSHIP_EXPECTED_DOMAIN_TARGET` are set.

The command cannot prove legal ownership of external accounts. It only verifies that the operator environment can see the expected technical resources.

## Required Manual Attestations

At handover, record these confirmations:

- Customer is owner/admin of the GitHub repository or organization.
- Customer is owner/admin of the DigitalOcean team and billing profile.
- Customer is owner/admin of the domain registrar and DNS provider.
- Customer owns or controls the WAHA deployment/session and WhatsApp number.
- Customer owns the WAHO API account/credentials when the live WAHO API is provided.
- Customer owns real payment provider credentials when payments move beyond fake/manual flows.
- Production secrets were generated in customer-controlled accounts.
- Maintainer-only temporary access was revoked or downgraded after handover.

## Secret Custody Rules

- Never commit production secrets to the repository.
- Production API keys must be generated in customer-owned provider dashboards.
- Rotate secrets after external contractors or temporary maintainers lose access.
- Rotate secrets after a suspected leak.
- Store production secrets only in DigitalOcean App Platform, provider dashboards, or an approved customer secret manager.
- Keep `.env.example` as a checklist, not as a secret source.

## Ownership Sign-Off

Record at handover:

- Customer legal name:
- Customer technical owner:
- GitHub owner:
- DigitalOcean account/team:
- DigitalOcean app ID:
- DigitalOcean database cluster ID:
- Domain registrar/DNS provider:
- WAHA session owner:
- WhatsApp number owner:
- WAHO API credential owner:
- Payment provider credential owner:
- Sign-off date:
