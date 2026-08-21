import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ARAB_COUNTRY_IDS,
  inferCountryIdFromPhone,
  suggestedLanguageForCountry,
} from '../src/server/domain/account-country';
import {
  asiacellWahoPackages,
  mastercardWahoPackages,
} from '../src/data/catalog-seeds';
import { allCountrySeeds, arabCountrySeeds } from '../src/data/arab-country-seeds';
import { countryCatalog } from '../src/data/country-catalog';
import { phoneCountries } from '../src/data/phone-countries';
import {
  assertManualFulfillmentInput,
  isManualFulfillmentMode,
} from '../src/server/domain/fulfillment';
import { createWhatsAppNotificationMessage } from '../src/server/domain/whatsapp-notifications';
import { getOrderStatusGuidance } from '../src/lib/easy-use';

const repoRoot = join(import.meta.dir, '..');

describe('multi-category catalog', () => {
  test('keeps the WAHO MasterCard and Asiacell price lists from the approved reference', () => {
    expect(mastercardWahoPackages.map(({ priceIqd, balance }) => [priceIqd, balance])).toEqual([
      [10_000, 60_000],
      [15_000, 100_000],
      [20_000, 125_000],
      [25_000, 155_000],
      [50_000, 310_000],
      [75_000, 500_000],
      [100_000, 620_000],
      [150_000, 1_000_000],
    ]);
    expect(asiacellWahoPackages.map(({ priceIqd, balance }) => [priceIqd, balance])).toEqual([
      [5_000, 28_000],
      [10_000, 55_000],
      [15_000, 83_000],
      [25_000, 138_000],
      [30_000, 165_000],
      [50_000, 275_000],
    ]);
  });

  test('persists admin-managed categories and product fulfillment modes', () => {
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260822120000_add_catalog_categories_manual_fulfillment/migration.sql'),
      'utf8'
    );

    expect(schema).toContain('model CatalogCategory');
    expect(schema).toContain('enum ProductFulfillmentMode');
    expect(schema).toContain('catalogCategoryId');
    expect(schema).toContain('fulfillmentCodeEncrypted');
    expect(migration).toContain('CREATE TABLE "catalog_categories"');
    expect(migration).toContain('"fulfillmentMode"');
  });

  test('keeps package prices behind authentication while category metadata stays public', () => {
    const productsRoute = readFileSync(join(repoRoot, 'src/app/api/products/route.ts'), 'utf8');
    const productRoute = readFileSync(join(repoRoot, 'src/app/api/products/[slug]/route.ts'), 'utf8');
    const categoryRoute = readFileSync(join(repoRoot, 'src/app/api/categories/[slug]/route.ts'), 'utf8');

    expect(productsRoute).toContain('getOptionalUser');
    expect(productsRoute).toContain('packages: authenticated');
    expect(productRoute).toContain('requireUser');
    expect(categoryRoute).toContain('requireUser');
  });
});

describe('country-aware account defaults', () => {
  const countries = [
    { id: 'iq', phoneCode: '+964' },
    { id: 'sa', phoneCode: '+966' },
    { id: 'ae', phoneCode: '+971' },
    { id: 'eg', phoneCode: '+20' },
    { id: 'nl', phoneCode: '+31' },
  ];

  test('covers every Arab League country in the managed storefront scope', () => {
    expect(ARAB_COUNTRY_IDS.size).toBe(22);
    expect(arabCountrySeeds).toHaveLength(22);
    for (const countryId of ['iq', 'sa', 'ae', 'eg', 'jo', 'kw', 'ma', 'dz', 'om', 'qa', 'ps', 'ye']) {
      expect(ARAB_COUNTRY_IDS.has(countryId)).toBe(true);
    }
  });

  test('deploys all Arab-country currencies and rates without relying on a manual seed', () => {
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260822170000_seed_arab_country_pricing/migration.sql'),
      'utf8'
    );
    const palestine = arabCountrySeeds.find((country) => country.id === 'ps');

    expect(palestine?.currency).toBe('ILS');
    expect(migration).toContain('INSERT INTO "countries"');
    expect(migration).toContain('INSERT INTO "exchange_rates"');
    expect(migration).toContain("'ps', 'PS', 'Palestine'");
    expect(migration).toContain('UPDATE "products"');
  });

  test('keeps every selectable international dial code compatible with the database constraint', () => {
    expect(allCountrySeeds.length).toBeGreaterThan(200);
    for (const country of allCountrySeeds) {
      expect(country.phoneCode).toMatch(/^\+[1-9][0-9]{0,8}$/);
    }
  });

  test('uses general dial codes for large shared numbering plans without breaking regional codes', () => {
    const loginCode = (id: string) => phoneCountries.find((country) => country.id === id)?.phoneCode;
    const pricingCode = (id: string) => countryCatalog.find((country) => country.id === id)?.phoneCode;

    for (const source of [loginCode, pricingCode]) {
      expect(source('us')).toBe('+1');
      expect(source('ca')).toBe('+1');
      expect(source('ru')).toBe('+7');
      expect(source('kz')).toBe('+7');
      expect(source('jm')).toBe('+1876');
    }
  });

  test('infers the active country from the international WhatsApp number', () => {
    expect(inferCountryIdFromPhone('+9647822255851', countries)).toBe('iq');
    expect(inferCountryIdFromPhone('+31612345678', countries)).toBe('nl');
    expect(inferCountryIdFromPhone('+971501234567', countries)).toBe('ae');
    expect(inferCountryIdFromPhone('+99912345678', countries)).toBeNull();
  });

  test('suggests Arabic for Arab countries and keeps Chinese/English sensible elsewhere', () => {
    expect(suggestedLanguageForCountry('iq')).toBe('ar');
    expect(suggestedLanguageForCountry('ma')).toBe('ar');
    expect(suggestedLanguageForCountry('cn')).toBe('zh');
    expect(suggestedLanguageForCountry('nl')).toBe('en');
  });
});

describe('manual fulfillment and WhatsApp delivery', () => {
  test('requires a purchased code only for manual-code products', () => {
    expect(isManualFulfillmentMode('MANUAL_CODE')).toBe(true);
    expect(isManualFulfillmentMode('MANUAL_TOPUP')).toBe(true);
    expect(isManualFulfillmentMode('WAHO_API')).toBe(false);
    expect(assertManualFulfillmentInput('MANUAL_CODE', { code: 'ASIA-1234' })).toEqual({
      code: 'ASIA-1234',
      note: undefined,
    });
    expect(() => assertManualFulfillmentInput('MANUAL_CODE', {})).toThrow('FULFILLMENT_CODE_REQUIRED');
    expect(assertManualFulfillmentInput('MANUAL_TOPUP', { note: 'Applied by operator' })).toEqual({
      code: undefined,
      note: 'Applied by operator',
    });
  });

  test('builds clear owner and customer messages without changing the order transaction', () => {
    const ownerMessage = createWhatsAppNotificationMessage({
      type: 'OWNER_ORDER_ALERT',
      orderId: 'ORD-42',
      productName: 'WAHO via Asiacell',
      customerPhone: '+9647812345678',
      amount: 5_000,
      currency: 'IQD',
    });
    const deliveryMessage = createWhatsAppNotificationMessage({
      type: 'DELIVERY_CODE',
      orderId: 'ORD-42',
      productName: 'WAHO via Asiacell',
      deliveryCode: 'ASIA-1234',
    });

    expect(ownerMessage).toContain('ORD-42');
    expect(ownerMessage).toContain('WAHO via Asiacell');
    expect(ownerMessage).toContain('+9647812345678');
    expect(deliveryMessage).toContain('ASIA-1234');
    expect(deliveryMessage).toContain('ORD-42');
  });

  test('explains manual delivery without claiming that WAHO already received the top-up', () => {
    const processing = getOrderStatusGuidance('processing', 'en', 'manual_code');
    const completed = getOrderStatusGuidance('completed', 'en', 'manual_code');

    expect(processing).toContain('WhatsApp');
    expect(processing).not.toContain('sent to WAHO');
    expect(completed).toContain('delivered');
  });
});
