# Scope Deviations from PDF Baseline

This document records accepted scope decisions that intentionally differ from the original PDF baseline.

## Scope Baseline

The PDF baseline describes a broader digital-services platform with multiple games, apps, products, categories, promotions, provider routing, wallet operations, reporting, and admin management.

## Accepted Current Scope

The accepted current product scope is WAHO-only account top-up.

In the current application:

- The public customer journey is focused on WAHO account top-ups.
- Seeded and customer-facing catalog behavior should expose WAHO top-up as the active production product.
- Copy, visual hierarchy, mobile flow, and admin operations should stay WAHO top-up focused.
- Other games, apps, products, and categories from the PDF baseline are not part of the accepted public production scope unless approved through change control.

## Deviation Register

| ID | PDF baseline expectation | Accepted implementation | Reason | Status |
| --- | --- | --- | --- | --- |
| SD-001 | Multiple games/apps/products/categories can be offered. | WAHO-only account top-up is the active product scope. | Later product direction explicitly narrowed the app to WAHO top-ups only. | Accepted deviation |
| SD-002 | Product discovery may include broad game/app browsing. | Navigation and catalog should guide users directly to WAHO top-up. | A broad catalog would distract from the only supported production action. | Accepted deviation |
| SD-003 | Provider/product expansion may support multiple product types. | Provider abstraction remains extensible, but active production fulfillment is WAHO top-up. | Extensibility is retained without exposing unsupported products. | Accepted deviation |

## Acceptance Impact

This deviation is not a defect when:

- WAHO top-up works as the primary customer journey.
- Unsupported games/apps/products are not presented as purchasable production options.
- Admin and operational docs clearly state that broader product categories require change control.

This deviation becomes a new feature request when:

- The customer wants to sell additional games, apps, vouchers, or categories.
- A real provider API becomes available for non-WAHO products.
- Public navigation must support multi-product discovery.

## Change Control

Adding additional games/apps/products/categories requires:

- Product/category data model review.
- Provider API or manual fulfillment process for each new product type.
- Pricing and currency rules.
- Admin management and reporting changes.
- Customer-facing translations.
- E2E coverage for the new purchase flow.
- Written approval before production exposure.
