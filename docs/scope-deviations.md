# WAHO-First Catalog Scope

This document records the accepted product strategy for the Al-Wasl Digital application.

## Scope Baseline

The PDF baseline describes a broader digital-services platform with multiple games, apps, products, categories, promotions, provider routing, wallet operations, reporting, and admin management.

## Implemented Product Strategy

The production launch remains focused on WAHO account top-ups, because that is the only customer journey currently intended for public use.

The application is no longer hardcoded as a WAHO-only technical scope:

- WAHO is the active launch product and remains the first public signal.
- The database supports multiple product records, categories, countries, packages, pricing rules, banners, promotions, and provider routing.
- Admin users can create additional top-up products from the catalog section.
- Newly created products are inactive by default, so WAHO remains the only public flow until an operator explicitly enables another product.
- Extra products must have provider routing, pricing, support process, translations, and QA completed before production activation.

## Scope Register

| ID | PDF baseline expectation | Implemented approach | Status |
| --- | --- | --- | --- |
| SC-001 | Multiple games/apps/products/categories can be offered. | Catalog infrastructure and admin product creation are implemented; WAHO is the active launch product. | Implemented as WAHO-first |
| SC-002 | Product discovery may include broad game/app browsing. | Public navigation remains WAHO-focused to avoid distracting from the only approved live flow. | Implemented as WAHO-first |
| SC-003 | Provider/product expansion may support multiple product types. | Provider abstraction and admin catalog controls are extensible; non-WAHO products stay inactive until approved. | Implemented as controlled expansion |

## Acceptance Impact

This is production-ready when:

- WAHO top-up works as the primary customer journey.
- Admin can add future products without a code change.
- Unsupported products are not active or purchasable until their provider, pricing, support and translations are ready.
- Product expansion is recorded as an operational activation decision, not a defect in the launch scope.

## Activation Checklist for Additional Products

Before making a non-WAHO product active:

- Confirm provider API or manual fulfillment process.
- Configure provider routing and fallback behavior.
- Add top-up packages, pricing rules, currency/country availability, and banners if needed.
- Complete customer-facing copy and translations.
- Run admin/product/order E2E coverage for the new product.
- Written approval before production exposure.
