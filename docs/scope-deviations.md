# Managed Multi-Category Catalog Scope

This document records the current product strategy for the Al-Wasl Digital recharge application.

## Scope Baseline

The PDF baseline describes a digital-services platform with multiple products, categories, promotions, provider routing, wallet operations, reporting, and admin management.

## Implemented Product Strategy

The production storefront is no longer WAHO-only. It launches with two customer-facing recharge categories:

- WAHO MasterCard balance packages, prepared for automatic WAHO API fulfillment.
- WAHO via Asiacell codes, handled manually and delivered privately through WhatsApp.

The catalog remains controlled by administrators:

- Categories, products, packages, country availability, prices, banners and promotions are database-managed.
- Admin users can add and edit categories and products without changing source code.
- A product explicitly selects automatic WAHO API, manual code or manual top-up fulfillment.
- Newly created products remain inactive by default until pricing, delivery, translations and QA are complete.
- Public package prices require an authenticated customer and are filtered for the customer's country.

## Scope Register

| ID | Baseline expectation | Implemented approach | Status |
| --- | --- | --- | --- |
| SC-001 | Multiple products and categories can be offered. | Admin-managed categories and products are live, with WAHO and Asiacell as the initial categories. | Implemented |
| SC-002 | Product discovery supports clear category selection. | Category metadata is public; prices and ordering require WhatsApp authentication. | Implemented |
| SC-003 | Products can use different delivery methods. | Automatic WAHO API, manual code and manual top-up modes have separate order behavior. | Implemented |
| SC-004 | Additional categories can be introduced safely. | New products default to inactive and require an explicit admin activation after operational checks. | Implemented as controlled expansion |

## Activation Checklist for Additional Products

Before making any additional product active:

- Confirm its provider API or documented manual fulfillment process.
- Configure packages, country availability, prices, currencies and exchange rates.
- Add localized customer copy and a suitable category image.
- Confirm owner and customer WhatsApp notification behavior.
- Run admin, order, mobile and RTL end-to-end coverage.
- Record operational approval before production exposure.
