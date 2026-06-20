# Mobile API Contract

This document defines the native-app contract for the customer-facing WAHO top-up flow. The machine-readable source of truth is `docs/openapi.yaml`.

## Scope

Included:

- OTP login and session lookup.
- Action-scoped OTP challenges for financial actions.
- WAHO product catalog and WAHO account verification.
- Customer order creation/history/detail.
- Wallet ledger and manual deposit requests.
- Public countries, banners, and promotions.

Excluded from the mobile contract:

- Admin dashboard and admin mutation routes.
- Cron/job routes.
- Fake payment routes.
- Internal provider request and fulfillment callbacks.

## Authentication

API v1 uses an httpOnly session cookie named `alwasl_session`.

1. Call `POST /api/auth/login` with a phone number.
2. Call `POST /api/auth/verify` with the OTP.
3. Persist the returned `Set-Cookie` value and resend it on authenticated requests.
4. Call `POST /api/auth/logout` to revoke the session.

Native clients must not assume bearer-token auth until a new API version documents it.

## Sensitive OTP

Financial actions require a separate OTP challenge from `POST /api/auth/otp/request`.

Use these purposes:

- `ORDER_CONFIRMATION` before `POST /api/orders`.
- `WALLET_TOP_UP` before `POST /api/wallet/manual-deposits`.
- `PAYMENT_CONFIRMATION` is reserved for future real payment confirmation.
- `WALLET_CHANGE` is reserved for future wallet/security changes.

## Idempotency

`POST /api/orders` requires an `Idempotency-Key` header. Mobile clients should generate a stable key for one user action and reuse it only for retrying the exact same payload.

If the same key is replayed with the same payload, the API returns the existing order with `Idempotency-Replayed: true`. If the same key is reused with different payload data, the API returns a conflict.

## Production Behavior

Real payment providers are not part of API v1 yet. Wallet funding should use manual deposits, where the balance is credited only after admin approval.

WAHO fulfillment can return dependency errors when the live provider path is not configured or temporarily unavailable. Mobile clients should show a retry-safe message and keep the order status from the API as the source of truth.

## Versioning Rules

- Additive fields are allowed in API v1.
- Removing fields, changing enum values, or changing auth semantics requires a new API version.
- Native apps should ignore unknown response fields.
