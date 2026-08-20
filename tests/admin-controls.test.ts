import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getClientIpFromHeaders,
  isAccessBlockActive,
  maskAccessBlockValue,
  normalizeAccessBlockValue,
} from '../src/server/domain/access-blocks';
import {
  assertCountryPrimaryRate,
  assertCountryPricePolicy,
  convertIqdPrice,
  resolveCountryPriceCurrencies,
} from '../src/server/domain/country-pricing';
import { countryCatalog } from '../src/data/country-catalog';
import { generatedContentCatalog } from '../src/data/content-catalog.generated';
import {
  assertContentPlaceholdersPreserved,
  extractContentPlaceholders,
  resolveContentValue,
} from '../src/server/domain/content-overrides';
import { createWhatsAppNotificationMessage } from '../src/server/domain/whatsapp-notifications';
import { applyContentPlaceholders } from '../src/server/services/content';
import {
  getWahaHealth,
  sendWhatsAppText,
} from '../src/server/providers/waha-whatsapp';

describe('central access block rules', () => {
  test('normalizes WhatsApp numbers, WAHO IDs and IP addresses consistently', () => {
    expect(normalizeAccessBlockValue('WHATSAPP', '0031 6 2139 3391')).toBe('31621393391');
    expect(normalizeAccessBlockValue('WAHO_ID', '  WAHO_AbC-123  ')).toBe('waho_abc-123');
    expect(normalizeAccessBlockValue('IP_ADDRESS', '::ffff:192.0.2.45')).toBe('192.0.2.45');
    expect(normalizeAccessBlockValue('IP_ADDRESS', '[2001:DB8::12]')).toBe('2001:db8::12');
  });

  test('rejects unusable values before a database lookup', () => {
    expect(() => normalizeAccessBlockValue('WHATSAPP', '123')).toThrow('INVALID_BLOCK_VALUE');
    expect(() => normalizeAccessBlockValue('WAHO_ID', 'x')).toThrow('INVALID_BLOCK_VALUE');
    expect(() => normalizeAccessBlockValue('IP_ADDRESS', 'not-an-ip')).toThrow('INVALID_BLOCK_VALUE');
  });

  test('masks sensitive values for admin summaries and audit metadata', () => {
    expect(maskAccessBlockValue('WHATSAPP', '31621393391')).toBe('*******3391');
    expect(maskAccessBlockValue('WAHO_ID', 'waho_abc-123')).toBe('wah******123');
    expect(maskAccessBlockValue('IP_ADDRESS', '192.0.2.45')).toBe('192.0.*.*');
    expect(maskAccessBlockValue('IP_ADDRESS', '2001:db8::12')).toBe('2001:db8:…');
  });

  test('treats inactive, revoked and expired rules as non-blocking', () => {
    const now = new Date('2026-07-31T12:00:00.000Z');

    expect(isAccessBlockActive({ isActive: true, revokedAt: null, expiresAt: null }, now)).toBe(true);
    expect(isAccessBlockActive({
      isActive: true,
      revokedAt: null,
      expiresAt: new Date('2026-07-31T12:01:00.000Z'),
    }, now)).toBe(true);
    expect(isAccessBlockActive({
      isActive: true,
      revokedAt: null,
      expiresAt: new Date('2026-07-31T11:59:59.000Z'),
    }, now)).toBe(false);
    expect(isAccessBlockActive({ isActive: false, revokedAt: null, expiresAt: null }, now)).toBe(false);
    expect(isAccessBlockActive({
      isActive: true,
      revokedAt: new Date('2026-07-31T11:00:00.000Z'),
      expiresAt: null,
    }, now)).toBe(false);
  });

  test('reads a normalized client IP from trusted proxy headers in priority order', () => {
    expect(getClientIpFromHeaders(new Headers({
      'cf-connecting-ip': '2001:DB8::12',
      'x-real-ip': '192.0.2.8',
      'x-forwarded-for': '198.51.100.7, 10.0.0.1',
    }))).toBe('2001:db8::12');
    expect(getClientIpFromHeaders(new Headers({
      'x-forwarded-for': '::ffff:192.0.2.45, 10.0.0.1',
    }))).toBe('192.0.2.45');
    expect(getClientIpFromHeaders(new Headers({
      'x-forwarded-for': 'not-an-ip',
    }))).toBeUndefined();
  });
});

describe('country price display policy', () => {
  test('orders the primary currency first and removes local duplicates', () => {
    expect(resolveCountryPriceCurrencies({
      localCurrencyCode: 'EUR',
      primaryPriceCurrency: 'LOCAL',
      showPricesInIqd: true,
      showPricesInUsd: true,
      showPricesInLocal: true,
    })).toEqual(['EUR', 'IQD', 'USD']);

    expect(resolveCountryPriceCurrencies({
      localCurrencyCode: 'IQD',
      primaryPriceCurrency: 'LOCAL',
      showPricesInIqd: true,
      showPricesInUsd: false,
      showPricesInLocal: true,
    })).toEqual(['IQD']);
  });

  test('converts IQD using a managed rate and refuses a missing rate', () => {
    expect(convertIqdPrice(10_000, 'IQD', {})).toBe(10_000);
    expect(convertIqdPrice(10_000, 'USD', { USD: 0.000763 })).toBeCloseTo(7.63, 6);
    expect(convertIqdPrice(10_000, 'EUR', { USD: 0.000763 })).toBeNull();
  });

  test('rejects a hidden primary currency and provides a global country catalog', () => {
    expect(() => assertCountryPricePolicy({
      localCurrencyCode: 'EUR',
      primaryPriceCurrency: 'LOCAL',
      showPricesInIqd: true,
      showPricesInUsd: false,
      showPricesInLocal: false,
    })).toThrow('PRIMARY_PRICE_CURRENCY_HIDDEN');
    expect(countryCatalog.length).toBeGreaterThan(220);
    expect(countryCatalog.find((country) => country.code === 'NL')).toMatchObject({
      name: 'Netherlands',
      currencyCode: 'EUR',
    });
  });

  test('requires a managed rate before a converted currency can be primary', () => {
    const policy = {
      localCurrencyCode: 'EUR',
      primaryPriceCurrency: 'LOCAL' as const,
      showPricesInIqd: true,
      showPricesInUsd: false,
      showPricesInLocal: true,
    };

    expect(() => assertCountryPrimaryRate(policy, {})).toThrow('PRIMARY_PRICE_RATE_REQUIRED');
    expect(() => assertCountryPrimaryRate(policy, { EUR: 0.0007 })).not.toThrow();
    expect(() => assertCountryPrimaryRate({
      ...policy,
      primaryPriceCurrency: 'IQD',
    }, {})).not.toThrow();
  });
});

describe('admin content overrides', () => {
  const defaults = {
    en: 'Choose amount',
    ar: 'اختر المبلغ',
    zh: '选择金额',
  };

  test('returns an active override for the selected language', () => {
    expect(resolveContentValue('en', defaults, {
      isActive: true,
      valueEn: 'Choose balance',
      valueAr: 'اختر الرصيد',
      valueZh: '选择余额',
    })).toBe('Choose balance');
    expect(resolveContentValue('ar', defaults, {
      isActive: true,
      valueEn: 'Choose balance',
      valueAr: 'اختر الرصيد',
      valueZh: '选择余额',
    })).toBe('اختر الرصيد');
  });

  test('falls back to defaults for inactive or incomplete overrides', () => {
    expect(resolveContentValue('zh', defaults, {
      isActive: false,
      valueEn: 'Changed',
      valueAr: 'تم التغيير',
      valueZh: '已更改',
    })).toBe('选择金额');
    expect(resolveContentValue('zh', defaults, {
      isActive: true,
      valueEn: 'Choose balance',
      valueAr: 'اختر الرصيد',
      valueZh: '',
    })).toBe('选择金额');
  });

  test('keeps required runtime placeholders intact in every managed translation', () => {
    expect(extractContentPlaceholders('Order {{orderId}} for {{wahoId}}')).toEqual([
      'orderId',
      'wahoId',
    ]);
    expect(() => assertContentPlaceholdersPreserved(
      'Order {{orderId}} for {{wahoId}}',
      'Bestelling {{orderId}} voor {{wahoId}}'
    )).not.toThrow();
    expect(() => assertContentPlaceholdersPreserved(
      'Order {{orderId}} for {{wahoId}}',
      'Bestelling voor {{wahoId}}'
    )).toThrow('CONTENT_PLACEHOLDER_MISMATCH');
  });

  test('exposes a generated catalog and runtime/admin content endpoints', () => {
    const root = join(import.meta.dir, '..');
    const generatedCatalog = readFileSync(join(root, 'src/data/content-catalog.generated.ts'), 'utf8');
    const publicRoute = readFileSync(join(root, 'src/app/api/content/route.ts'), 'utf8');
    const adminRoute = readFileSync(join(root, 'src/app/api/admin/content/route.ts'), 'utf8');

    expect(generatedCatalog).toContain('generatedContentCatalog');
    expect((generatedCatalog.match(/"key":/g) ?? []).length).toBeGreaterThan(100);
    expect(generatedCatalog).toContain('Top up WAHO in four simple steps.');
    expect(publicRoute).toContain('prisma.contentOverride.findMany');
    expect(adminRoute).toContain("requirePermission('CONTENT_MANAGE')");
    expect(adminRoute).toContain('adminContentOverrideSchema');
  });

  test('ships Chinese copy for every editable text except intentional brand identifiers', () => {
    const intentionalIdentifiers = new Set([
      'AsiaHawala',
      'USDT',
      'WAHO ID',
      'ZainCash',
      '1. WAHO ID',
    ]);
    const untranslated = generatedContentCatalog
      .filter((entry) => entry.valueZh === entry.valueEn && !intentionalIdentifiers.has(entry.key))
      .map((entry) => entry.key);

    expect(untranslated).toEqual([]);
  });
});

describe('production persistence contracts', () => {
  test('stores central blocks, country price policies and content overrides in PostgreSQL', () => {
    const root = join(import.meta.dir, '..');
    const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8');

    expect(schema).toContain('enum AccessBlockType');
    expect(schema).toContain('model AccessBlock');
    expect(schema).toContain('normalizedValue');
    expect(schema).toContain('notificationRequested');
    expect(schema).toContain('enum PrimaryPriceCurrency');
    expect(schema).toContain('showPricesInIqd');
    expect(schema).toContain('showPricesInUsd');
    expect(schema).toContain('showPricesInLocal');
    expect(schema).toContain('model ContentOverride');
    expect(schema).toMatch(/key\s+String\s+@unique/);
  });
});

describe('WAHA transport hardening', () => {
  const env = {
    WAHA_BASE_URL: 'https://waha.example.test',
    WAHA_API_KEY: 'unit-test-key',
    WAHA_SESSION: 'default',
  };

  function jsonResponse(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  test('retries a transient WAHA failure once and then succeeds', async () => {
    let calls = 0;

    await expect(getWahaHealth({
      env,
      maxRetries: 1,
      retryDelayMs: 0,
      fetcher: async () => {
        calls += 1;
        return calls === 1
          ? jsonResponse({ error: 'temporary' }, 503)
          : jsonResponse({ status: 'WORKING' });
      },
    })).resolves.toMatchObject({ healthy: true });

    expect(calls).toBe(2);
  });

  test('does not retry an authentication error', async () => {
    let calls = 0;

    await expect(getWahaHealth({
      env,
      maxRetries: 2,
      retryDelayMs: 0,
      fetcher: async () => {
        calls += 1;
        return jsonResponse({ error: 'unauthorized' }, 401);
      },
    })).rejects.toThrow('WAHA_HEALTH_FAILED');

    expect(calls).toBe(1);
  });

  test('applies a timeout without exposing provider response details', async () => {
    const fetcher = (_input: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });

    await expect(sendWhatsAppText('+31612345678', 'Sensitive message', {
      env,
      timeoutMs: 5,
      maxRetries: 0,
      fetcher,
    })).rejects.toThrow('WAHA_REQUEST_TIMEOUT');
  });
});

describe('customer WhatsApp confirmations', () => {
  test('builds clear order-created and account-blocked messages', () => {
    expect(createWhatsAppNotificationMessage({
      type: 'ORDER_CREATED',
      orderId: 'ORD-100',
      amount: 25_000,
      currency: 'IQD',
      wahoId: 'waho-42',
    })).toContain('Order ORD-100 received');

    const blocked = createWhatsAppNotificationMessage({
      type: 'ACCOUNT_BLOCKED',
      reason: 'Repeated invalid account details',
    });
    expect(blocked).toContain('access has been blocked');
    expect(blocked).toContain('Repeated invalid account details');
  });

  test('replaces managed template placeholders without leaking unknown values', () => {
    expect(applyContentPlaceholders(
      'Order {{orderId}} for {{wahoId}}. {{unknown}}',
      { orderId: 'ORD-8', wahoId: 'WAHO-42' }
    )).toBe('Order ORD-8 for WAHO-42. ');
  });
});
