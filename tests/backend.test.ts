import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { shouldLoadAdminSummary } from '../src/app/admin/admin-access';
import { getPromotionState } from '../src/app/promotions/promotion-state';
import { walletTopUpDialogCopy } from '../src/app/wallet/wallet-dialog-copy';
import { mobileMenuSheetCopy } from '../src/components/layout/mobile-menu-copy';
import { resolveOtpPhone } from '../src/contexts/auth-flow';
import { getDefaultPhoneCountry, phoneCountries } from '../src/data/phone-countries';
import { banners, games } from '../src/data/mock-data';
import { wahoRechargeInfo } from '../src/data/waho-recharge-info';
import { normalizePhoneForDialCode } from '../src/lib/phone';
import { getAuditRequestContext, shouldAuditAdminUser } from '../src/server/admin-audit';
import { hashOtp, resolveOtpPepper, safeCompare } from '../src/server/crypto';
import { isBlockedProductionDemoOtp, isDemoAuthEnabled, resolveDemoOtpForPhone } from '../src/server/demo-auth';
import {
  hasPermission,
  staffPermissions,
  staffRolePermissionMap,
} from '../src/server/permissions';
import { calculateOrderPricing, createOrderId } from '../src/server/domain/orders';
import {
  applyCustomPricingRule,
  selectCustomPricingRule,
  type CustomPricingRuleForPricing,
} from '../src/server/domain/custom-pricing';
import {
  manualDepositLedgerReference,
  normalizeManualDepositTransactionId,
} from '../src/server/domain/manual-deposits';
import { createRefundReference, resolveFakePaymentResult, resolveProviderFulfillmentResult } from '../src/server/domain/payments';
import {
  hasProviderRetryAttemptsRemaining,
  nextProviderRetryAt,
  PROVIDER_RETRY_DELAY_MS,
  PROVIDER_RETRY_MAX_ATTEMPTS,
} from '../src/server/domain/provider-retry';
import {
  createWhatsAppNotificationDedupeKey,
  createWhatsAppNotificationMessage,
} from '../src/server/domain/whatsapp-notifications';
import { nextWalletBalance } from '../src/server/domain/wallet';
import { assertCronRequest } from '../src/server/cron';
import { handleApiError } from '../src/server/http';
import {
  assertMatchingIdempotencyFingerprint,
  createIdempotencyFingerprint,
  requireIdempotencyKey,
} from '../src/server/idempotency';
import {
  activeMembershipLevelIds,
  getMembershipDiscount,
  membershipLevels,
  resolveMembershipForSpend,
} from '../src/lib/membership';
import { mapUser } from '../src/server/mappers';
import { isOtpAttemptLocked, nextOtpAttemptCount } from '../src/server/otp-policy';
import { isFakePaymentEnabled } from '../src/server/payment-policy';
import { createOtpMessage, deliverOtp, isDirectWahaOtpEnabled } from '../src/server/providers/otp';
import { getProviderAvailableBalance, selectProviderAccounts } from '../src/server/providers/provider-registry';
import { getWahoProvider, getWahoProviderInfo, isMockWahoEnabled, isWahaWahoProviderEnabled } from '../src/server/providers/waho';
import {
  checkWhatsAppRecipient,
  getWahaHealth,
  normalizeWhatsAppPhone,
  sendWhatsAppText,
  validateWahaConfig,
} from '../src/server/providers/waha-whatsapp';
import { isRateLimitExceeded } from '../src/server/rate-limit';
import { sensitiveOtpPurposes } from '../src/server/sensitive-otp';
import {
  createProviderLowBalanceMessage,
  getProviderAccountAvailableBalance,
  isProviderLowBalance,
} from '../src/server/services/provider-balance-alerts';
import {
  createReportBuckets,
  getReportRange,
  summarizeReportBuckets,
} from '../src/server/services/reports';
import {
  buildMonitoringWebhookPayload,
  checkMonitoringTarget,
  DEFAULT_LOG_RETENTION_DAYS,
  getMonitoringExternalConfig,
  resolveLogRetentionDays,
  resolveMonitoringWebhookUrl,
} from '../src/server/services/monitoring';
import { createExcelWorkbookBuffer } from '../src/server/excel-export';
import {
  createAdminProductSchema,
  createMonitoringTargetSchema,
  createOrderSchema,
  fakePaymentConfirmSchema,
  normalizePhone,
  runMonitoringChecksSchema,
  sensitiveOtpRequestSchema,
  updateMonitoringSettingsSchema,
  updateMonitoringTargetSchema,
  walletTopUpSchema,
} from '../src/server/validation';
import type { User } from '../src/types';

const require = createRequire(import.meta.url);
process.env.SKIP_MONITORING_DB = 'true';

describe('auth helpers', () => {
  test('normalizes phone numbers and hashes OTP codes predictably', () => {
    const phone = normalizePhone('964 781 234 5678');
    const otpEnv = { OTP_PEPPER: 'unit-test-otp-pepper' };
    const hash = hashOtp(phone, '123456', otpEnv);

    expect(phone).toBe('+9647812345678');
    expect(safeCompare(hash, hashOtp(phone, '123456', otpEnv))).toBe(true);
    expect(safeCompare(hash, hashOtp(phone, '654321', otpEnv))).toBe(false);
  });

  test('requires an explicit OTP pepper for hashing', () => {
    expect(() => resolveOtpPepper({})).toThrow('OTP_SECRET_NOT_CONFIGURED');
    expect(() => resolveOtpPepper({ OTP_PEPPER: 'replace-with-a-long-random-otp-pepper' })).toThrow(
      'OTP_SECRET_NOT_CONFIGURED'
    );
    expect(resolveOtpPepper({ OTP_PEPPER: 'unit-test-otp-pepper' })).toBe('unit-test-otp-pepper');
  });
});

describe('sensitive OTP purpose rules', () => {
  test('supports separate OTP purposes for financial and wallet actions in Prisma', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260619133000_add_sensitive_otp_purposes/migration.sql'),
      'utf8'
    );

    for (const purpose of ['LOGIN', ...sensitiveOtpPurposes]) {
      expect(schema).toContain(purpose);
    }

    for (const purpose of sensitiveOtpPurposes) {
      expect(migration).toContain(`'${purpose}'`);
    }
  });

  test('validates sensitive OTP request and action payloads', () => {
    expect(sensitiveOtpRequestSchema.parse({ purpose: 'ORDER_CONFIRMATION' })).toEqual({
      purpose: 'ORDER_CONFIRMATION',
    });
    expect(() => sensitiveOtpRequestSchema.parse({ purpose: 'LOGIN' })).toThrow();

    expect(createOrderSchema.parse({
      productSlug: 'waho-top-up',
      packageId: 'waho-topup-10000',
      wahoId: 'waho_1234',
      paymentMethod: 'wallet',
      otp: '123456',
    }).otp).toBe('123456');
    expect(walletTopUpSchema.parse({ amount: 5000, paymentMethod: 'zaincash', otp: '123456' }).otp).toBe('123456');
    expect(fakePaymentConfirmSchema.parse({ orderId: 'ORD-1', success: true, otp: '123456' }).otp).toBe('123456');
  });

  test('keeps login OTP scoped to LOGIN and protects financial mutation routes with purpose-specific OTP', () => {
    const repoRoot = join(import.meta.dir, '..');
    const loginRoute = readFileSync(join(repoRoot, 'src/app/api/auth/login/route.ts'), 'utf8');
    const verifyRoute = readFileSync(join(repoRoot, 'src/app/api/auth/verify/route.ts'), 'utf8');
    const sensitiveOtpRoute = readFileSync(join(repoRoot, 'src/app/api/auth/otp/request/route.ts'), 'utf8');
    const ordersRoute = readFileSync(join(repoRoot, 'src/app/api/orders/route.ts'), 'utf8');
    const walletTopUpRoute = readFileSync(join(repoRoot, 'src/app/api/wallet/top-up/route.ts'), 'utf8');
    const walletManualDepositRoute = readFileSync(join(repoRoot, 'src/app/api/wallet/manual-deposits/route.ts'), 'utf8');
    const fakePaymentRoute = readFileSync(join(repoRoot, 'src/app/api/payments/fake/confirm/route.ts'), 'utf8');
    const topUpPage = readFileSync(join(repoRoot, 'src/app/top-up/[slug]/page.tsx'), 'utf8');

    expect(loginRoute).toContain("purpose: 'LOGIN'");
    expect(verifyRoute).toContain("purpose: 'LOGIN'");
    expect(sensitiveOtpRoute).toContain('requestSensitiveOtpChallenge');
    expect(sensitiveOtpRoute).toContain('sensitiveOtpRequestSchema');
    expect(ordersRoute).toContain("verifySensitiveOtpChallenge(user, 'ORDER_CONFIRMATION'");
    expect(walletTopUpRoute).toContain("verifySensitiveOtpChallenge(user, 'WALLET_TOP_UP'");
    expect(walletManualDepositRoute).toContain("verifySensitiveOtpChallenge(user, 'WALLET_TOP_UP'");
    expect(fakePaymentRoute).toContain("verifySensitiveOtpChallenge(user, 'PAYMENT_CONFIRMATION'");
    expect(topUpPage).toContain("purpose: 'ORDER_CONFIRMATION'");
    expect(topUpPage).toContain('WhatsApp verification code');
  });
});

describe('security headers', () => {
  test('disables Next.js fingerprinting and sends browser hardening headers', async () => {
    const nextConfig = require('../next.config.js') as {
      poweredByHeader?: boolean;
      headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
    };

    expect(nextConfig.poweredByHeader).toBe(false);

    const [globalHeaders] = await nextConfig.headers();
    expect(globalHeaders.source).toBe('/(.*)');

    const headers = Object.fromEntries(globalHeaders.headers.map((header) => [header.key, header.value]));
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(headers['Content-Security-Policy']).toContain('upgrade-insecure-requests');
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains; preload');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
  });

  test('ships Next runtime config in the Docker runner image', () => {
    const repoRoot = join(import.meta.dir, '..');
    const dockerfile = readFileSync(join(repoRoot, 'Dockerfile'), 'utf8');

    expect(dockerfile).toContain('COPY --from=builder /app/next.config.js ./next.config.js');
  });
});

describe('API error boundaries', () => {
  test('does not expose unexpected internal error messages to clients', async () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const response = handleApiError(new Error('database password leaked in stack trace'));
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload).toEqual({ error: 'Unexpected server error' });
    } finally {
      console.error = originalConsoleError;
    }
  });

  test('maps provider configuration failures to safe public messages', async () => {
    const wahoResponse = handleApiError(new Error('WAHO_PROVIDER_NOT_CONFIGURED'));
    const paymentResponse = handleApiError(new Error('PAYMENT_PROVIDER_NOT_CONFIGURED'));

    expect(wahoResponse.status).toBe(424);
    expect(await wahoResponse.json()).toEqual({ error: 'WAHO verification is temporarily unavailable' });
    expect(paymentResponse.status).toBe(424);
    expect(await paymentResponse.json()).toEqual({ error: 'Payment is temporarily unavailable' });
  });

  test('does not return raw error.message in the shared API error handler', () => {
    const repoRoot = join(import.meta.dir, '..');
    const source = readFileSync(join(repoRoot, 'src/server/http.ts'), 'utf8');

    expect(source).not.toContain('fail(error.message');
  });
});

describe('monitoring and logging rules', () => {
  const repoRoot = join(import.meta.dir, '..');

  test('validates monitoring targets, settings, and run payloads', () => {
    expect(createMonitoringTargetSchema.parse({
      name: 'Production health',
      url: 'https://example.test/api/health',
    })).toMatchObject({
      name: 'Production health',
      method: 'GET',
      expectedStatus: 200,
      timeoutMs: 5000,
      intervalMinutes: 5,
      isActive: true,
    });

    expect(() => createMonitoringTargetSchema.parse({
      name: 'bad',
      url: 'not-a-url',
    })).toThrow();
    expect(() => updateMonitoringTargetSchema.parse({ timeoutMs: 500 })).toThrow();
    expect(updateMonitoringSettingsSchema.parse({ logRetentionDays: 45 })).toEqual({ logRetentionDays: 45 });
    expect(() => updateMonitoringSettingsSchema.parse({ logRetentionDays: 0 })).toThrow();
    expect(runMonitoringChecksSchema.parse({ targetId: 'monitor-1' })).toEqual({ targetId: 'monitor-1' });
  });

  test('builds external webhook payloads without leaking stack traces', () => {
    expect(resolveLogRetentionDays({})).toBe(DEFAULT_LOG_RETENTION_DAYS);
    expect(resolveLogRetentionDays({ LOG_RETENTION_DAYS: '999' })).toBe(365);
    expect(getMonitoringExternalConfig({
      MONITORING_ERROR_WEBHOOK_URL: 'https://hooks.example.test/error',
      MONITORING_STATUS_WEBHOOK_URL: '',
    })).toEqual({
      errorWebhookConfigured: true,
      statusWebhookConfigured: false,
    });
    expect(resolveMonitoringWebhookUrl('ERROR', {
      MONITORING_ERROR_WEBHOOK_URL: 'https://hooks.example.test/error',
      MONITORING_STATUS_WEBHOOK_URL: 'https://hooks.example.test/status',
    })).toBe('https://hooks.example.test/error');
    expect(resolveMonitoringWebhookUrl('INFO', {
      MONITORING_ERROR_WEBHOOK_URL: 'https://hooks.example.test/error',
      MONITORING_STATUS_WEBHOOK_URL: 'https://hooks.example.test/status',
    })).toBe('https://hooks.example.test/status');

    const payload = buildMonitoringWebhookPayload({
      severity: 'ERROR',
      source: 'api',
      message: 'Unexpected API error',
      metadata: { stack: 'secret stack details' },
    });

    expect(payload).toMatchObject({
      severity: 'ERROR',
      source: 'api',
      message: 'Unexpected API error',
    });
    expect(JSON.stringify(payload)).not.toContain('secret stack details');
  });

  test('checks uptime targets with status and latency results', async () => {
    const target = {
      id: 'target-1',
      name: 'Health',
      url: 'https://example.test/api/health',
      method: 'GET',
      expectedStatus: 200,
      timeoutMs: 5000,
      intervalMinutes: 5,
      isActive: true,
      lastStatus: 'UNKNOWN',
      lastCheckedAt: null,
    };

    await expect(checkMonitoringTarget(target as never, {
      fetcher: async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    })).resolves.toMatchObject({
      targetId: 'target-1',
      status: 'UP',
      statusCode: 200,
    });

    await expect(checkMonitoringTarget(target as never, {
      fetcher: async () => new Response(JSON.stringify({ error: 'down' }), { status: 503 }),
    })).resolves.toMatchObject({
      targetId: 'target-1',
      status: 'DOWN',
      statusCode: 503,
    });
  });

  test('persists monitoring schema, routes, admin controls, and cron hooks', () => {
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620190000_add_monitoring_logging/migration.sql'),
      'utf8'
    );
    const service = readFileSync(join(repoRoot, 'src/server/services/monitoring.ts'), 'utf8');
    const healthRoute = readFileSync(join(repoRoot, 'src/app/api/health/route.ts'), 'utf8');
    const adminRoute = readFileSync(join(repoRoot, 'src/app/api/admin/monitoring/route.ts'), 'utf8');
    const adminRunRoute = readFileSync(join(repoRoot, 'src/app/api/admin/monitoring/run/route.ts'), 'utf8');
    const cronRoute = readFileSync(join(repoRoot, 'src/app/api/jobs/monitoring/route.ts'), 'utf8');
    const retentionRoute = readFileSync(join(repoRoot, 'src/app/api/jobs/log-retention/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');
    const envExample = readFileSync(join(repoRoot, '.env.example'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

    expect(schema).toContain('enum MonitoringEventSeverity');
    expect(schema).toContain('enum MonitoringCheckStatus');
    expect(schema).toContain('model MonitoringTarget');
    expect(schema).toContain('model MonitoringEvent');
    expect(schema).toContain('model MonitoringSetting');
    expect(schema).toContain('MONITORING_MANAGE');
    expect(migration).toContain('CREATE TABLE "monitoring_targets"');
    expect(migration).toContain('CREATE TABLE "monitoring_events"');
    expect(migration).toContain('CREATE TABLE "monitoring_settings"');
    expect(migration).toContain('monitoring_settings_retention_range');
    expect(service).toContain('recordUnexpectedApiError');
    expect(service).toContain('MONITORING_ERROR_WEBHOOK_URL');
    expect(service).toContain('pruneMonitoringEvents');
    expect(healthRoute).toContain('getSystemHealth');
    expect(adminRoute).toContain("action: 'admin.monitoring.view'");
    expect(adminRoute).toContain('createMonitoringTargetSchema');
    expect(adminRoute).toContain('updateMonitoringSettingsSchema');
    expect(adminRunRoute).toContain('runMonitoringChecks');
    expect(cronRoute).toContain('assertCronRequest');
    expect(cronRoute).toContain('runMonitoringChecks');
    expect(retentionRoute).toContain('pruneMonitoringEvents');
    expect(adminPage).toContain("id: 'monitoring'");
    expect(adminPage).toContain('createMonitoringTarget');
    expect(adminPage).toContain('/api/admin/monitoring/run');
    expect(adminPage).toContain('/api/admin/monitoring/retention');
    expect(envExample).toContain('LOG_RETENTION_DAYS="30"');
    expect(envExample).toContain('MONITORING_ERROR_WEBHOOK_URL=""');
    expect(envExample).toContain('MONITORING_STATUS_WEBHOOK_URL=""');
    expect(readme).toContain('/api/health');
    expect(readme).toContain('/api/jobs/monitoring');
    expect(readme).toContain('/api/jobs/log-retention');
  });
});

describe('order creation rules', () => {
  test('calculates package totals with member discount', () => {
    const pricing = calculateOrderPricing(
      { basePrice: 10000, salePrice: null },
      { discountPercentage: 4 }
    );

    expect(pricing).toEqual({
      quantity: 1,
      unitPrice: 10000,
      totalPrice: 10000,
      discount: 400,
      finalPrice: 9600,
    });
  });

  test('creates deterministic order ids when clock and random source are fixed', () => {
    expect(createOrderId(new Date('2026-06-18T10:00:00Z'), 0.1234)).toBe('ORD-20260618-2110');
  });
});

describe('custom pricing rules', () => {
  const now = new Date('2026-06-20T12:00:00Z');
  const distributorRule: CustomPricingRuleForPricing = {
    id: 'rule-distributor',
    targetType: 'DISTRIBUTOR',
    priceType: 'FIXED_PRICE',
    value: 8500,
    productId: 'waho-top-up',
    packageId: 'pkg-10k',
    userId: null,
    priority: 20,
    isActive: true,
    applyMembershipDiscount: false,
    startDate: new Date('2026-06-01T00:00:00Z'),
    endDate: null,
  };

  test('selects the most specific active custom price for a distributor or customer', () => {
    const rules: CustomPricingRuleForPricing[] = [
      { ...distributorRule, id: 'rule-all', targetType: 'ALL', packageId: null, value: 9500, priority: 50 },
      distributorRule,
      { ...distributorRule, id: 'rule-expired', endDate: new Date('2026-06-10T00:00:00Z'), priority: 1 },
    ];

    expect(selectCustomPricingRule(rules, {
      userId: 'user-1',
      accountType: 'DISTRIBUTOR',
      productId: 'waho-top-up',
      packageId: 'pkg-10k',
    }, now)?.id).toBe('rule-distributor');

    expect(selectCustomPricingRule(rules, {
      userId: 'user-1',
      accountType: 'CUSTOMER',
      productId: 'waho-top-up',
      packageId: 'pkg-10k',
    }, now)?.id).toBe('rule-all');
  });

  test('applies fixed custom prices before optional membership discounts', () => {
    const customPrice = applyCustomPricingRule(10000, distributorRule, 6);
    expect(customPrice).toEqual({
      unitPrice: 8500,
      discount: 0,
      finalPrice: 8500,
      customPricingRuleId: 'rule-distributor',
    });

    const combinedRule = { ...distributorRule, applyMembershipDiscount: true };
    expect(applyCustomPricingRule(10000, combinedRule, 6)).toMatchObject({
      unitPrice: 8500,
      discount: 510,
      finalPrice: 7990,
      customPricingRuleId: 'rule-distributor',
    });
  });

  test('persists pricing-rule models, order snapshots, and admin management routes', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620150000_add_custom_pricing_rules/migration.sql'),
      'utf8'
    );
    const orderService = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');
    const adminSummary = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');

    expect(schema).toContain('model CustomPricingRule');
    expect(schema).toContain('enum PricingRuleTargetType');
    expect(schema).toContain('accountType        UserAccountType');
    expect(schema).toContain('customPricingRuleId String?');
    expect(schema).toContain('pricingSnapshot Json?');
    expect(migration).toContain('CREATE TABLE "custom_pricing_rules"');
    expect(migration).toContain('custom_pricing_rules_value_non_negative');
    expect(migration).toContain('custom_pricing_rules_user_target_requires_user');
    expect(orderService).toContain('selectCustomPricingRule');
    expect(orderService).toContain('customPricingRuleId: pricing.customPricingRuleId');
    expect(adminSummary).toContain('customPricingRules');
    expect(adminPage).toContain('createCustomPricingRule');
    expect(adminPage).toContain("adminJsonRequest('/api/admin/pricing-rules'");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/pricing-rules/${ruleId}`");
  });
});

describe('membership level rules', () => {
  test('uses the PDF IQD spend thresholds and discounts', () => {
    expect(
      membershipLevels.map(({ level, minSpent, discountPercentage }) => ({
        level,
        minSpent,
        discountPercentage,
      }))
    ).toEqual([
      { level: 'bronze', minSpent: 0, discountPercentage: 0 },
      { level: 'silver', minSpent: 2_000_000, discountPercentage: 2 },
      { level: 'gold', minSpent: 8_000_000, discountPercentage: 4 },
      { level: 'diamond', minSpent: 15_000_000, discountPercentage: 6 },
    ]);

    expect(activeMembershipLevelIds).toEqual(['bronze', 'silver', 'gold', 'diamond']);
    expect(activeMembershipLevelIds).not.toContain('platinum');
  });

  test('resolves membership from total spend instead of stale stored discount values', () => {
    expect(resolveMembershipForSpend(1_999_999).discountPercentage).toBe(0);
    expect(resolveMembershipForSpend(2_000_000).discountPercentage).toBe(2);
    expect(resolveMembershipForSpend(8_000_000).discountPercentage).toBe(4);
    expect(resolveMembershipForSpend(15_000_000).discountPercentage).toBe(6);
    expect(getMembershipDiscount('platinum')).toBe(0);
  });
});

describe('idempotency rules', () => {
  test('requires safe idempotency keys for mutation requests', () => {
    expect(requireIdempotencyKey(new Headers({ 'Idempotency-Key': 'order-123456' }))).toBe('order-123456');
    expect(() => requireIdempotencyKey(new Headers())).toThrow('IDEMPOTENCY_KEY_REQUIRED');
    expect(() => requireIdempotencyKey(new Headers({ 'Idempotency-Key': 'short' }))).toThrow(
      'IDEMPOTENCY_KEY_INVALID'
    );
    expect(() => requireIdempotencyKey(new Headers({ 'Idempotency-Key': 'bad key with spaces' }))).toThrow(
      'IDEMPOTENCY_KEY_INVALID'
    );
  });

  test('creates stable fingerprints independent of object key order', () => {
    const first = createIdempotencyFingerprint('orders.create', {
      productSlug: 'waho-top-up',
      packageId: 'pkg-1',
      wahoId: 'waho_1234',
      zoneId: '',
      paymentMethod: 'wallet',
    });
    const second = createIdempotencyFingerprint('orders.create', {
      paymentMethod: 'wallet',
      zoneId: '',
      wahoId: 'waho_1234',
      packageId: 'pkg-1',
      productSlug: 'waho-top-up',
    });

    expect(first).toBe(second);
    expect(() => assertMatchingIdempotencyFingerprint(first, second)).not.toThrow();
    expect(() => assertMatchingIdempotencyFingerprint(first, createIdempotencyFingerprint('orders.create', {
      productSlug: 'waho-top-up',
      packageId: 'pkg-2',
      wahoId: 'waho_1234',
      zoneId: '',
      paymentMethod: 'wallet',
    }))).toThrow('IDEMPOTENCY_KEY_REUSED');
  });

  test('stores idempotency keys and fingerprints with unique database constraints', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260619114500_add_idempotency_keys/migration.sql'),
      'utf8'
    );

    expect(schema).toContain('idempotencyKey');
    expect(schema).toContain('idempotencyFingerprint');
    expect(schema).toContain('@@unique([userId, idempotencyKey])');
    expect(schema).toContain('@@unique([orderId, idempotencyKey])');
    expect(migration).toContain('CREATE UNIQUE INDEX "orders_userId_idempotencyKey_key"');
    expect(migration).toContain('CREATE UNIQUE INDEX "payment_attempts_orderId_idempotencyKey_key"');
  });

  test('order and payment mutation routes require idempotency keys', () => {
    const repoRoot = join(import.meta.dir, '..');
    const ordersRoute = readFileSync(join(repoRoot, 'src/app/api/orders/route.ts'), 'utf8');
    const fakePaymentRoute = readFileSync(join(repoRoot, 'src/app/api/payments/fake/confirm/route.ts'), 'utf8');
    const orderService = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');
    const topUpPage = readFileSync(join(repoRoot, 'src/app/top-up/[slug]/page.tsx'), 'utf8');

    expect(ordersRoute).toContain('requireIdempotencyKey');
    expect(ordersRoute).toContain("createIdempotencyFingerprint('orders.create'");
    expect(fakePaymentRoute).toContain('requireIdempotencyKey');
    expect(fakePaymentRoute).toContain("createIdempotencyFingerprint('payments.fake.confirm'");
    expect(orderService).toContain('replayOrderFromIdempotency');
    expect(orderService).toContain('replayPaymentFromIdempotency');
    expect(orderService).toContain('P2002');
    expect(topUpPage).toContain("'Idempotency-Key': orderIdempotencyKeyRef.current");
  });
});

describe('fake payment rules', () => {
  test('never enables fake payment mutation APIs in production', () => {
    expect(isFakePaymentEnabled({ NODE_ENV: 'production', ENABLE_FAKE_PAYMENTS: 'true' })).toBe(false);
    expect(isFakePaymentEnabled({ NODE_ENV: 'production', ENABLE_FAKE_PAYMENTS: 'false' })).toBe(false);
  });

  test('enables fake payment mutation APIs only when explicitly configured outside production', () => {
    expect(isFakePaymentEnabled({ NODE_ENV: 'development', ENABLE_FAKE_PAYMENTS: 'true' })).toBe(true);
    expect(isFakePaymentEnabled({ NODE_ENV: 'development', ENABLE_FAKE_PAYMENTS: 'false' })).toBe(false);
    expect(isFakePaymentEnabled({ NODE_ENV: 'test' })).toBe(false);
  });

  test('marks successful completed provider responses as completed', () => {
    expect(resolveFakePaymentResult(true, 'completed')).toEqual({
      paymentStatus: 'COMPLETED',
      orderStatus: 'COMPLETED',
      completedAt: true,
    });
  });

  test('keeps successful processing provider responses in processing state', () => {
    expect(resolveFakePaymentResult(true, 'processing')).toEqual({
      paymentStatus: 'COMPLETED',
      orderStatus: 'PROCESSING',
      completedAt: false,
    });
  });

  test('marks failed fake payments as failed', () => {
    expect(resolveFakePaymentResult(false, 'completed')).toEqual({
      paymentStatus: 'FAILED',
      orderStatus: 'FAILED',
      completedAt: false,
    });
  });
});

describe('provider failure refund rules', () => {
  test('keeps final failed provider fulfillment mapped to a refundable order state', () => {
    expect(resolveProviderFulfillmentResult('failed')).toEqual({
      paymentStatus: 'REFUNDED',
      orderStatus: 'REFUNDED',
      completedAt: false,
      shouldRefund: true,
    });
    expect(resolveProviderFulfillmentResult('processing')).toEqual({
      paymentStatus: 'COMPLETED',
      orderStatus: 'PROCESSING',
      completedAt: false,
      shouldRefund: false,
    });
  });

  test('creates stable wallet refund references per order', () => {
    expect(createRefundReference('ORD-20260619-1234')).toBe('REFUND-ORD-20260619-1234');
  });

  test('compensates paid orders after provider retry exhaustion', () => {
    const repoRoot = join(import.meta.dir, '..');
    const orderService = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');
    const retryRunner = readFileSync(join(repoRoot, 'src/server/services/provider-retry-runner.ts'), 'utf8');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260619143000_add_wallet_refund_reference_uniqueness/migration.sql'),
      'utf8'
    );

    expect(orderService).toContain('refundPaidOrder');
    expect(orderService).toContain('scheduleProviderCreateRetry');
    expect(orderService).toContain('scheduleProviderRetryJob');
    expect(orderService).toContain("type: 'REFUND'");
    expect(orderService).toContain('walletBalance: { increment: current.finalPrice }');
    expect(orderService).toContain('totalSpent: { decrement: current.finalPrice }');
    expect(orderService).toContain("paymentStatus: 'REFUNDED'");
    expect(orderService).toContain('resolveProviderFulfillmentResult');
    expect(orderService).toContain('paymentResult.shouldRefund');
    expect(orderService).toContain('catch (error)');
    expect(orderService).toContain('isWahoProviderFailoverError(error)');
    expect(retryRunner).toContain("reason: 'Provider fulfillment failed after retry exhaustion'");
    expect(retryRunner).toContain('refundAfterRetryExhaustion');
    expect(retryRunner).toContain('refundPaidOrder');
    expect(schema).toContain('@@unique([userId, reference])');
    expect(migration).toContain('wallet_transactions_userId_reference_key');
  });

  test('exposes an admin-only refund route with OTP, rate limit, and audit logging', () => {
    const repoRoot = join(import.meta.dir, '..');
    const route = readFileSync(join(repoRoot, 'src/app/api/orders/[id]/refund/route.ts'), 'utf8');
    const validation = readFileSync(join(repoRoot, 'src/server/validation.ts'), 'utf8');

    expect(route).toContain('requirePermission');
    expect(route).toContain("requirePermission('ORDER_REFUND')");
    expect(route).toContain('assertRateLimit');
    expect(route).toContain("verifySensitiveOtpChallenge(admin, 'WALLET_CHANGE'");
    expect(route).toContain('refundOrderById');
    expect(route).toContain("action: 'orders.refund'");
    expect(route).toContain('recordAdminAuditLog');
    expect(validation).toContain('refundOrderSchema');
    expect(validation).toContain('otp: otpCodeSchema.optional()');
  });
});

describe('wallet ledger rules', () => {
  test('debits wallet balances only when funds are available', () => {
    expect(nextWalletBalance(250000, 9500)).toBe(240500);
    expect(() => nextWalletBalance(1000, 5000)).toThrow('INSUFFICIENT_WALLET_BALANCE');
  });

  test('database constraints protect financial values from going negative', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260619122500_add_financial_check_constraints/migration.sql'),
      'utf8'
    );

    expect(schema).toContain('20260619122500_add_financial_check_constraints');
    expect(migration).toContain('users_wallet_balance_non_negative');
    expect(migration).toContain('users_total_spent_non_negative');
    expect(migration).toContain('users_discount_percentage_range');
    expect(migration).toContain('topup_packages_amount_positive');
    expect(migration).toContain('topup_packages_base_price_non_negative');
    expect(migration).toContain('topup_packages_sale_price_non_negative');
    expect(migration).toContain('topup_packages_sale_price_not_above_base_price');
    expect(migration).toContain('orders_quantity_positive');
    expect(migration).toContain('orders_unit_price_non_negative');
    expect(migration).toContain('orders_total_price_non_negative');
    expect(migration).toContain('orders_discount_non_negative');
    expect(migration).toContain('orders_final_price_non_negative');
    expect(migration).toContain('orders_discount_not_above_total_price');
    expect(migration).toContain('orders_final_price_matches_total_minus_discount');
    expect(migration).toContain('payment_attempts_amount_non_negative');
    expect(migration).toContain('wallet_transactions_balance_non_negative');
    expect(migration).not.toContain('wallet_transactions_amount_non_negative');
  });

  test('wallet top-up API does not directly mutate app balance without a real payment provider', () => {
    const repoRoot = join(import.meta.dir, '..');
    const source = readFileSync(join(repoRoot, 'src/app/api/wallet/top-up/route.ts'), 'utf8');

    expect(source).toContain('PAYMENT_PROVIDER_NOT_CONFIGURED');
    expect(source).not.toContain('walletBalance +');
    expect(source).not.toContain('walletTransaction.create');
    expect(source).not.toContain('tx.user.update');
    expect(source).not.toContain('mapWalletTransaction');
    expect(source).not.toContain('mapUser');
    expect(source).not.toContain('prisma');
  });

  test('wallet order purchases use a database-level conditional debit', () => {
    const repoRoot = join(import.meta.dir, '..');
    const source = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');

    expect(source).toContain('tx.order.updateMany');
    expect(source).toContain("status: 'PENDING'");
    expect(source).toContain("paymentStatus: 'PENDING'");
    expect(source).toContain('tx.user.updateMany');
    expect(source).toContain('walletBalance: { gte: order.finalPrice }');
    expect(source).toContain('walletBalance: { decrement: order.finalPrice }');
    expect(source).toContain('debitResult.count !== 1');
    expect(source).not.toContain('nextWalletBalance(orderUser.walletBalance');
  });

  test('manual deposit transaction ids are normalized into stable ledger references', () => {
    expect(normalizeManualDepositTransactionId('  zc-778899  ')).toBe('ZC-778899');
    expect(manualDepositLedgerReference(' zc-778899 ')).toBe('MANUAL-DEPOSIT:ZC-778899');
  });

  test('manual deposits use a unique transaction id and admin approval before wallet credit', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620160000_add_manual_deposits/migration.sql'),
      'utf8'
    );
    const createRoute = readFileSync(join(repoRoot, 'src/app/api/wallet/manual-deposits/route.ts'), 'utf8');
    const adminRoute = readFileSync(join(repoRoot, 'src/app/api/admin/manual-deposits/[id]/route.ts'), 'utf8');
    const service = readFileSync(join(repoRoot, 'src/server/services/manual-deposits.ts'), 'utf8');
    const adminSummary = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');

    expect(schema).toContain('model ManualDeposit');
    expect(schema).toContain('enum ManualDepositStatus');
    expect(schema).toMatch(/providerRef\s+String\?\s+@unique/);
    expect(schema).toMatch(/transactionId\s+String\s+@unique/);
    expect(migration).toContain('CREATE TABLE "manual_deposits"');
    expect(migration).toContain('payment_attempts_providerRef_key');
    expect(migration).toContain('manual_deposits_transactionId_key');
    expect(migration).toContain('manual_deposits_amount_positive');
    expect(createRoute).toContain("verifySensitiveOtpChallenge(user, 'WALLET_TOP_UP'");
    expect(createRoute).toContain('createManualDeposit');
    expect(adminRoute).toContain('reviewManualDeposit');
    expect(adminRoute).toContain("action: 'admin.manual_deposit.review'");
    expect(service).toContain('MANUAL_DEPOSIT_TRANSACTION_ID_EXISTS');
    expect(service).toContain("status: 'PENDING'");
    expect(service).toContain("status: 'APPROVED'");
    expect(service).toContain('walletBalance: { increment: deposit.amount }');
    expect(service).toContain('walletTransaction.create');
    expect(adminSummary).toContain('manualDeposits');
    expect(adminPage).toContain('reviewManualDeposit');
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/manual-deposits/${depositId}`");
  });
});

describe('multi-provider routing rules', () => {
  test('adds provider and provider-account persistence with balance and request linkage', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260619150000_add_multi_provider_accounts/migration.sql'),
      'utf8'
    );

    expect(schema).toContain('model Provider');
    expect(schema).toContain('model ProviderAccount');
    expect(schema).toContain('enum ProviderService');
    expect(schema).toContain('enum ProviderAccountType');
    expect(schema).toContain('enum ProviderAccountStatus');
    expect(schema).toContain('providerAccountId');
    expect(schema).toContain('balance           Int');
    expect(schema).toContain('fallbackEnabled   Boolean');
    expect(migration).toContain('CREATE TABLE "providers"');
    expect(migration).toContain('CREATE TABLE "provider_accounts"');
    expect(migration).toContain('provider_accounts_balance_non_negative');
    expect(migration).toContain('provider_accounts_reserved_balance_not_above_balance');
    expect(migration).toContain('provider_requests_providerAccountId_fkey');
  });

  test('selects eligible provider accounts by priority, status, product support, and available balance', () => {
    const provider = {
      id: 'provider-waho-top-up',
      code: 'waho-top-up',
      name: 'WAHO Network',
      service: 'WAHO_TOP_UP',
      apiEndpoint: 'waha://api/sendText',
      isActive: true,
      priority: 1,
      supportedProducts: ['waho-top-up'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const candidates = [
      {
        id: 'offline',
        provider,
        providerId: provider.id,
        isActive: true,
        fallbackEnabled: true,
        priority: 1,
        status: 'OFFLINE',
        balance: 100000,
        reservedBalance: 0,
        minBalance: 0,
        currency: 'IQD',
        dailyLimit: null,
        dailyUsed: 0,
        successRate: 100,
        supportedProducts: ['waho-top-up'],
      },
      {
        id: 'low-balance',
        provider,
        providerId: provider.id,
        isActive: true,
        fallbackEnabled: true,
        priority: 1,
        status: 'ONLINE',
        balance: 9000,
        reservedBalance: 0,
        minBalance: 0,
        currency: 'IQD',
        dailyLimit: null,
        dailyUsed: 0,
        successRate: 100,
        supportedProducts: ['waho-top-up'],
      },
      {
        id: 'primary',
        provider,
        providerId: provider.id,
        isActive: true,
        fallbackEnabled: true,
        priority: 1,
        status: 'DEGRADED',
        balance: 50000,
        reservedBalance: 5000,
        minBalance: 5000,
        currency: 'IQD',
        dailyLimit: null,
        dailyUsed: 0,
        successRate: 98,
        supportedProducts: ['waho-top-up'],
      },
      {
        id: 'secondary',
        provider,
        providerId: provider.id,
        isActive: true,
        fallbackEnabled: true,
        priority: 2,
        status: 'ONLINE',
        balance: 100000,
        reservedBalance: 0,
        minBalance: 0,
        currency: 'IQD',
        dailyLimit: null,
        dailyUsed: 0,
        successRate: 100,
        supportedProducts: ['waho-top-up'],
      },
    ];

    expect(getProviderAvailableBalance(candidates[2])).toBe(40000);
    expect(
      selectProviderAccounts(candidates as never, {
        service: 'WAHO_TOP_UP',
        productSlug: 'waho-top-up',
        amount: 10000,
        currency: 'IQD',
      }).map((account) => account.id)
    ).toEqual(['primary', 'secondary']);
  });

  test('routes WAHO fulfillment through provider accounts and failover before refunding', () => {
    const repoRoot = join(import.meta.dir, '..');
    const orderService = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');
    const router = readFileSync(join(repoRoot, 'src/server/providers/waho-router.ts'), 'utf8');
    const registry = readFileSync(join(repoRoot, 'src/server/providers/provider-registry.ts'), 'utf8');
    const adminSummaryRoute = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const seed = readFileSync(join(repoRoot, 'prisma/seed.ts'), 'utf8');

    expect(orderService).toContain('getWahoVerificationProvider');
    expect(orderService).toContain('createWahoTopupWithFailover');
    expect(orderService).toContain('providerAccountId');
    expect(router).toContain('WahoProviderFailoverError');
    expect(router).toContain('reserveProviderAccountBalance');
    expect(router).toContain('releaseProviderAccountReservation');
    expect(router).toContain('settleProviderAccountSuccess');
    expect(registry).toContain('selectProviderAccounts');
    expect(registry).toContain('dailyLimit');
    expect(adminSummaryRoute).toContain('prisma.providerAccount.findMany');
    expect(adminSummaryRoute).toContain('mapProviderAccount');
    expect(seed).toContain('prisma.provider.upsert');
    expect(seed).toContain('prisma.providerAccount.upsert');
    expect(seed).toContain('WAHO_PROVIDER_INITIAL_BALANCE');
  });
});

describe('provider retry queue rules', () => {
  test('uses the required 3 minute delay and 3 attempt retry policy', () => {
    const now = new Date('2026-06-20T08:00:00.000Z');

    expect(PROVIDER_RETRY_DELAY_MS).toBe(180_000);
    expect(PROVIDER_RETRY_MAX_ATTEMPTS).toBe(3);
    expect(nextProviderRetryAt(now).toISOString()).toBe('2026-06-20T08:03:00.000Z');
    expect(hasProviderRetryAttemptsRemaining(2, 3)).toBe(true);
    expect(hasProviderRetryAttemptsRemaining(3, 3)).toBe(false);
  });

  test('persists retry jobs with due-time indexes and attempt constraints', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620090000_add_provider_retry_jobs/migration.sql'),
      'utf8'
    );

    expect(schema).toContain('enum ProviderRetryJobStatus');
    expect(schema).toContain('enum ProviderRetryJobType');
    expect(schema).toContain('model ProviderRetryJob');
    expect(schema).toContain('maxAttempts       Int                    @default(3)');
    expect(schema).toContain('@@index([status, nextRunAt])');
    expect(migration).toContain('CREATE TABLE "provider_retry_jobs"');
    expect(migration).toContain('CREATE TYPE "ProviderRetryJobType"');
    expect(migration).toContain('provider_retry_jobs_status_nextRunAt_idx');
    expect(migration).toContain('provider_retry_jobs_attempt_count_not_above_max');
  });

  test('schedules create retries and status polls instead of immediately refunding provider failures', () => {
    const repoRoot = join(import.meta.dir, '..');
    const orderService = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');
    const retryJobs = readFileSync(join(repoRoot, 'src/server/services/provider-retry-jobs.ts'), 'utf8');

    expect(orderService).toContain('scheduleProviderCreateRetry');
    expect(orderService).toContain("type: 'CREATE_TOPUP'");
    expect(orderService).toContain("type: 'STATUS_POLL'");
    expect(orderService).toContain("lastError: 'Provider status is still processing'");
    expect(retryJobs).toContain('activeRetryStatuses');
    expect(retryJobs).toContain('nextProviderRetryAt()');
    expect(retryJobs).toContain('PROVIDER_RETRY_MAX_ATTEMPTS');
  });

  test('claims due jobs with SKIP LOCKED and reschedules or refunds after max attempts', () => {
    const repoRoot = join(import.meta.dir, '..');
    const runner = readFileSync(join(repoRoot, 'src/server/services/provider-retry-runner.ts'), 'utf8');

    expect(runner).toContain('FOR UPDATE SKIP LOCKED');
    expect(runner).toContain('"attemptCount" = "attemptCount" + 1');
    expect(runner).toContain('"attemptCount" < "maxAttempts"');
    expect(runner).toContain('runDueProviderRetryJobs');
    expect(runner).toContain('handleCreateTopupJob');
    expect(runner).toContain('handleStatusPollJob');
    expect(runner).toContain('rescheduleJob(job');
    expect(runner).toContain('refundAfterRetryExhaustion');
    expect(runner).toContain('STATUS_POLL_TIMEOUT');
  });

  test('exposes a cron-protected provider retry runner route', () => {
    const repoRoot = join(import.meta.dir, '..');
    const route = readFileSync(join(repoRoot, 'src/app/api/jobs/provider-retries/route.ts'), 'utf8');
    const envExample = readFileSync(join(repoRoot, '.env.example'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

    expect(() => assertCronRequest(new Request('https://example.test'), { CRON_SECRET: 'secret' } as never)).toThrow(
      'FORBIDDEN'
    );
    expect(() =>
      assertCronRequest(new Request('https://example.test', { headers: { Authorization: 'Bearer secret' } }), {
        CRON_SECRET: 'secret',
      } as never)
    ).not.toThrow();
    expect(route).toContain('assertCronRequest');
    expect(route).toContain('runDueProviderRetryJobs');
    expect(route).toContain('export async function GET');
    expect(route).toContain('export async function POST');
    expect(envExample).toContain('CRON_SECRET=""');
    expect(readme).toContain('/api/jobs/provider-retries');
  });
});

describe('provider low-balance alert rules', () => {
  test('calculates provider available balance and threshold status', () => {
    const healthy = {
      balance: 100000,
      reservedBalance: 10000,
      minBalance: 10000,
      lowBalanceThreshold: 25000,
    };
    const low = {
      balance: 30000,
      reservedBalance: 5000,
      minBalance: 5000,
      lowBalanceThreshold: 25000,
    };

    expect(getProviderAccountAvailableBalance(healthy)).toBe(80000);
    expect(isProviderLowBalance(healthy)).toBe(false);
    expect(getProviderAccountAvailableBalance(low)).toBe(20000);
    expect(isProviderLowBalance(low)).toBe(true);
  });

  test('creates clear low-balance alert copy without exposing secrets', () => {
    const account = {
      id: 'provider-account-1',
      providerId: 'provider-1',
      provider: {
        id: 'provider-1',
        code: 'waho-top-up',
        name: 'WAHO Top-Up Provider Network',
        service: 'WAHO_TOP_UP',
        apiEndpoint: 'waha://api/sendText',
        isActive: true,
        priority: 1,
        supportedProducts: ['waho-top-up'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      name: 'WAHA Primary',
      type: 'WAHA_WHATSAPP',
      apiEndpoint: 'waha://api/sendText',
      isActive: true,
      priority: 1,
      fallbackEnabled: true,
      balance: 30000,
      reservedBalance: 5000,
      minBalance: 5000,
      lowBalanceThreshold: 25000,
      currency: 'IQD',
      dailyLimit: null,
      dailyUsed: 0,
      successRate: 100,
      avgResponseTimeMs: 200,
      status: 'ONLINE',
      failureCount: 0,
      lastHealthCheck: null,
      lastFailureAt: null,
      supportedProducts: ['waho-top-up'],
      config: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const message = createProviderLowBalanceMessage(account as never);

    expect(message).toContain('Provider low balance alert');
    expect(message).toContain('WAHA Primary');
    expect(message).toContain('20,000 IQD');
    expect(message).toContain('25,000 IQD');
    expect(message).not.toContain('WAHA_API_KEY');
  });

  test('persists provider low-balance thresholds and alert history', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620100000_add_provider_low_balance_alerts/migration.sql'),
      'utf8'
    );

    expect(schema).toContain('enum ProviderBalanceAlertStatus');
    expect(schema).toContain('model ProviderBalanceAlert');
    expect(schema).toContain('lowBalanceThreshold Int');
    expect(schema).toContain('balanceAlerts     ProviderBalanceAlert[]');
    expect(migration).toContain('CREATE TABLE "provider_balance_alerts"');
    expect(migration).toContain('ALTER TABLE "provider_accounts" ADD COLUMN "lowBalanceThreshold"');
    expect(migration).toContain('provider_accounts_low_balance_threshold_non_negative');
    expect(migration).toContain('provider_balance_alerts_providerAccountId_fkey');
  });

  test('opens admin alerts, sends optional WhatsApp alerts, and resolves recovered balances', () => {
    const repoRoot = join(import.meta.dir, '..');
    const service = readFileSync(join(repoRoot, 'src/server/services/provider-balance-alerts.ts'), 'utf8');
    const registry = readFileSync(join(repoRoot, 'src/server/providers/provider-registry.ts'), 'utf8');
    const adminSummaryRoute = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');
    const route = readFileSync(join(repoRoot, 'src/app/api/jobs/provider-alerts/route.ts'), 'utf8');
    const envExample = readFileSync(join(repoRoot, '.env.example'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

    expect(service).toContain('PROVIDER_ALERT_WHATSAPP_PHONE');
    expect(service).toContain('sendWhatsAppText');
    expect(service).toContain("channels: ['admin', 'whatsapp']");
    expect(service).toContain("status: 'RESOLVED'");
    expect(registry).toContain('evaluateProviderBalanceAlertByAccountId');
    expect(adminSummaryRoute).toContain('providerBalanceAlerts');
    expect(adminSummaryRoute).toContain('mapProviderBalanceAlert');
    expect(adminPage).toContain('providerBalanceAlerts');
    expect(adminPage).toContain('Provider balance is low');
    expect(route).toContain('assertCronRequest');
    expect(route).toContain('checkProviderLowBalanceAlerts');
    expect(envExample).toContain('WAHO_PROVIDER_LOW_BALANCE_THRESHOLD');
    expect(envExample).toContain('PROVIDER_ALERT_WHATSAPP_PHONE');
    expect(readme).toContain('/api/jobs/provider-alerts');
  });
});

describe('WAHO provider rules', () => {
  test('never enables mock WAHO in production, even when env is misconfigured', async () => {
    const env = {
      NODE_ENV: 'production',
      ENABLE_MOCK_WAHO: 'true',
      WAHO_API_BASE_URL: 'https://example.test/waho',
    };

    expect(isMockWahoEnabled(env)).toBe(false);
    expect(getWahoProviderInfo(env)).toMatchObject({
      id: 'waho-api',
      isActive: false,
      status: 'offline',
    });
    await expect(getWahoProvider(env).verifyWahoAccount('123456')).rejects.toThrow('WAHO_PROVIDER_NOT_CONFIGURED');
  });

  test('keeps local mock WAHO explicit and never reports fulfillment as completed', async () => {
    const env = {
      NODE_ENV: 'development',
      ENABLE_MOCK_WAHO: 'true',
    };
    const provider = getWahoProvider(env);

    expect(isMockWahoEnabled(env)).toBe(true);
    await expect(provider.verifyWahoAccount('abc')).resolves.toMatchObject({ valid: false });
    await expect(provider.verifyWahoAccount('waho_1234')).resolves.toMatchObject({ valid: true });
    await expect(provider.createWahoTopup({
      orderId: 'ORD-TEST',
      wahoId: 'waho_1234',
      amount: 10000,
      currency: 'IQD',
    })).resolves.toMatchObject({ status: 'processing' });
    await expect(provider.getWahoTopupStatus('WAHO-MOCK-TEST')).resolves.toBe('processing');
  });

  test('enables the WAHA WhatsApp fulfillment bridge when production config is complete', () => {
    const env = {
      NODE_ENV: 'production',
      WAHA_BASE_URL: 'https://waha.example.test',
      WAHA_API_KEY: 'unit-test-key',
      WAHA_SESSION: 'default',
      WAHO_FULFILLMENT_PHONE: '0612345678',
    };

    expect(isWahaWahoProviderEnabled(env)).toBe(true);
    expect(getWahoProviderInfo(env)).toMatchObject({
      id: 'waha-whatsapp-fulfillment',
      isActive: true,
      status: 'degraded',
      apiEndpoint: 'waha://api/sendText',
    });
  });
});

describe('WAHA direct WhatsApp provider', () => {
  const wahaEnv = {
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

  test('fails clearly without WAHA env vars', () => {
    expect(() => validateWahaConfig({})).toThrow('WAHA_NOT_CONFIGURED');
  });

  test('normalizes Dutch and Iraqi WhatsApp phone numbers', () => {
    expect(normalizeWhatsAppPhone('0612345678')).toBe('31612345678');
    expect(normalizeWhatsAppPhone('+31612345678')).toBe('31612345678');
    expect(normalizeWhatsAppPhone('0031621393391')).toBe('31621393391');
    expect(normalizeWhatsAppPhone('07868426969')).toBe('9647868426969');
    expect(normalizeWhatsAppPhone('+96407868426969')).toBe('9647868426969');
    expect(normalizeWhatsAppPhone('+310612345678')).toBe('31612345678');
  });

  test('parses healthy WAHA sessions from WORKING and CONNECTED states', async () => {
    await expect(
      getWahaHealth({
        env: wahaEnv,
        fetcher: async () => jsonResponse({ status: 'WORKING' }),
      })
    ).resolves.toMatchObject({ healthy: true, status: 'WORKING' });

    await expect(
      getWahaHealth({
        env: wahaEnv,
        fetcher: async () => jsonResponse({ state: 'CONNECTED' }),
      })
    ).resolves.toMatchObject({ healthy: true, state: 'CONNECTED' });

    await expect(
      getWahaHealth({
        env: wahaEnv,
        fetcher: async () => jsonResponse({ engine: { state: 'CONNECTED' } }),
      })
    ).resolves.toMatchObject({ healthy: true, state: 'CONNECTED' });
  });

  test('short-circuits invalid phone numbers without WAHA calls', async () => {
    let calls = 0;

    await expect(
      checkWhatsAppRecipient('12', {
        env: wahaEnv,
        fetcher: (async () => {
          calls += 1;
          return jsonResponse({ numberExists: true });
        }),
      })
    ).rejects.toThrow('WAHA_INVALID_PHONE');

    expect(calls).toBe(0);
  });

  test('parses recipient existence from every supported WAHA response shape', async () => {
    for (const payload of [{ numberExists: true }, { exists: true }, { result: true }]) {
      await expect(
        checkWhatsAppRecipient('+31612345678', {
          env: wahaEnv,
          fetcher: async () => jsonResponse(payload),
        })
      ).resolves.toMatchObject({ normalized: '31612345678', exists: true });
    }
  });

  test('builds the exact WAHA sendText payload', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });

      if (String(url).includes('/api/sessions/')) return jsonResponse({ status: 'WORKING' });
      if (String(url).includes('/api/contacts/check-exists')) return jsonResponse({ numberExists: true });
      return jsonResponse({ id: 'message-1' });
    };

    await expect(sendWhatsAppText('0612345678', 'Hallo via WAHA', { env: wahaEnv, fetcher })).resolves.toMatchObject({
      success: true,
      chatId: '31612345678@c.us',
      messageId: 'message-1',
    });

    expect(calls[2].url).toBe('https://waha.example.test/api/sendText');
    expect(calls[2].init?.method).toBe('POST');
    expect(calls[2].init?.headers).toEqual({
      'X-Api-Key': 'unit-test-key',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({
      chatId: '31612345678@c.us',
      reply_to: null,
      text: 'Hallo via WAHA',
      linkPreview: true,
      linkPreviewHighQuality: false,
      session: 'default',
    });
  });

  test('returns clean errors for non-2xx WAHA send responses', async () => {
    const fetcher = async (url: string | URL | Request) => {
      if (String(url).includes('/api/sessions/')) return jsonResponse({ status: 'WORKING' });
      if (String(url).includes('/api/contacts/check-exists')) return jsonResponse({ numberExists: true });
      return jsonResponse({ error: 'secret-looking-provider-details' }, 500);
    };

    await expect(sendWhatsAppText('0612345678', 'Hallo via WAHA', { env: wahaEnv, fetcher })).rejects.toThrow(
      'WAHA_SEND_FAILED'
    );
  });
});

describe('international OTP login country rules', () => {
  test('offers a full phone-country list independent of storefront country filtering', () => {
    const countryCodes = new Set(phoneCountries.map((country) => country.code));
    const countryIds = new Set(phoneCountries.map((country) => country.id));

    expect(phoneCountries.length).toBeGreaterThan(220);
    expect(countryIds.size).toBe(phoneCountries.length);
    expect(getDefaultPhoneCountry()).toMatchObject({ code: 'IQ', phoneCode: '+964' });
    expect(countryCodes.has('NL')).toBe(true);
    expect(countryCodes.has('CN')).toBe(true);
    expect(countryCodes.has('US')).toBe(true);
    expect(countryCodes.has('IN')).toBe(true);
  });

  test('builds WAHA-ready login phone numbers from any selected country', () => {
    expect(normalizePhoneForDialCode('+964', '07868426969')).toBe('+9647868426969');
    expect(normalizePhoneForDialCode('+31', '0612345678')).toBe('+31612345678');
    expect(normalizePhoneForDialCode('+86', '13800138000')).toBe('+8613800138000');
    expect(normalizePhoneForDialCode('+1', '2025550188')).toBe('+12025550188');
    expect(normalizePhoneForDialCode('+964', '+96407868426969')).toBe('+9647868426969');
  });

  test('auth page uses the international phone-country list and verifies the submitted phone', () => {
    const repoRoot = join(import.meta.dir, '..');
    const authPage = readFileSync(join(repoRoot, 'src/app/auth/page.tsx'), 'utf8');

    expect(authPage).toContain("from '@/data/phone-countries'");
    expect(authPage).toContain('phoneCountries.map');
    expect(authPage).toContain('normalizePhoneForDialCode(selectedPhoneCountry.phoneCode, phone)');
    expect(authPage).toContain('verifyOtp(otpCode, submittedPhone)');
    expect(authPage).toContain('const handleResendOtp');
    expect(authPage).toContain('onClick={handleResendOtp}');
    expect(authPage).not.toContain('countries.map((country)');
  });
});

describe('OTP delivery provider rules', () => {
  const wahaEnv = {
    OTP_CHANNEL: 'whatsapp',
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

  test('uses direct WAHA WhatsApp delivery when WAHA config is present', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });

      if (String(url).includes('/api/sessions/')) return jsonResponse({ status: 'WORKING' });
      if (String(url).includes('/api/contacts/check-exists')) return jsonResponse({ numberExists: true });
      return jsonResponse({ id: 'otp-message-1' });
    };

    expect(isDirectWahaOtpEnabled(wahaEnv)).toBe(true);
    await deliverOtp({ phone: '0612345678', code: '123456' }, { env: wahaEnv, fetcher });

    expect(calls.map((call) => call.url)).toEqual([
      'https://waha.example.test/api/sessions/default',
      'https://waha.example.test/api/contacts/check-exists?phone=31612345678&session=default',
      'https://waha.example.test/api/sendText',
    ]);
    expect(JSON.parse(String(calls[2].init?.body))).toMatchObject({
      chatId: '31612345678@c.us',
      text: createOtpMessage('123456'),
      session: 'default',
    });
  });

  test('keeps webhook delivery only as fallback when direct WAHA is not configured', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const env = {
      NODE_ENV: 'production',
      OTP_WEBHOOK_URL: 'https://otp.example.test/send',
      OTP_WEBHOOK_TOKEN: 'webhook-token',
      OTP_CHANNEL: 'whatsapp',
    };
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return jsonResponse({ ok: true });
    };

    expect(isDirectWahaOtpEnabled(env)).toBe(false);
    await deliverOtp({ phone: '+9647812345678', code: '654321' }, { env, fetcher });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://otp.example.test/send');
    expect(calls[0].init?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer webhook-token',
    });
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      phone: '+9647812345678',
      code: '654321',
      channel: 'whatsapp',
    });
  });

  test('fails production OTP delivery when neither WAHA nor webhook is configured', async () => {
    let calls = 0;
    await expect(
      deliverOtp(
        { phone: '+9647812345678', code: '123456' },
        {
          env: { NODE_ENV: 'production' },
          fetcher: async () => {
            calls += 1;
            return jsonResponse({});
          },
        }
      )
    ).rejects.toThrow('OTP provider is not configured');

    expect(calls).toBe(0);
  });

  test('maps direct WAHA OTP failures to the existing safe OTP delivery error', async () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      const fetcher = async (url: string | URL | Request) => {
        if (String(url).includes('/api/sessions/')) return jsonResponse({ status: 'WORKING' });
        if (String(url).includes('/api/contacts/check-exists')) return jsonResponse({ numberExists: true });
        return jsonResponse({ error: 'provider secret details' }, 500);
      };

      await expect(deliverOtp({ phone: '0612345678', code: '123456' }, { env: wahaEnv, fetcher })).rejects.toThrow(
        'Failed to deliver OTP'
      );
    } finally {
      console.warn = originalWarn;
    }
  });
});

describe('WhatsApp notification rules', () => {
  test('builds clear customer messages and stable dedupe keys for payment, top-up and marketing events', () => {
    expect(createWhatsAppNotificationDedupeKey('PAYMENT_RECEIVED', 'order', 'ORD-1')).toBe(
      'PAYMENT_RECEIVED:order:ORD-1'
    );
    expect(createWhatsAppNotificationDedupeKey('MARKETING', 'batch', 'BATCH-1', 'user-1')).toBe(
      'MARKETING:batch:BATCH-1:user-1'
    );

    expect(createWhatsAppNotificationMessage({
      type: 'PAYMENT_RECEIVED',
      orderId: 'ORD-1',
      amount: 10000,
      currency: 'IQD',
    })).toContain('Payment received');

    expect(createWhatsAppNotificationMessage({
      type: 'TOPUP_SUCCESS',
      orderId: 'ORD-2',
      amount: 25000,
      currency: 'IQD',
      wahoId: 'WAHO-777',
    })).toContain('WAHO top-up completed');

    expect(createWhatsAppNotificationMessage({
      type: 'TOPUP_FAILURE',
      orderId: 'ORD-3',
      amount: 5000,
      currency: 'IQD',
      reason: 'Provider failed',
    })).toContain('could not be completed');

    expect(createWhatsAppNotificationMessage({
      type: 'MARKETING',
      marketingMessage: 'Special WAHO top-up offer today.',
    })).toBe('Special WAHO top-up offer today.');
  });

  test('persists WhatsApp notification attempts and wires all production event hooks', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620170000_add_whatsapp_notifications/migration.sql'),
      'utf8'
    );
    const service = readFileSync(join(repoRoot, 'src/server/services/whatsapp-notifications.ts'), 'utf8');
    const ordersService = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');
    const manualDepositsService = readFileSync(join(repoRoot, 'src/server/services/manual-deposits.ts'), 'utf8');
    const retryRunner = readFileSync(join(repoRoot, 'src/server/services/provider-retry-runner.ts'), 'utf8');
    const adminRoute = readFileSync(join(repoRoot, 'src/app/api/admin/whatsapp/marketing/route.ts'), 'utf8');
    const adminSummary = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const adminExport = readFileSync(join(repoRoot, 'src/app/api/admin/export/route.ts'), 'utf8');
    const validation = readFileSync(join(repoRoot, 'src/server/validation.ts'), 'utf8');

    expect(schema).toContain('enum WhatsAppNotificationType');
    expect(schema).toContain('enum WhatsAppNotificationStatus');
    expect(schema).toContain('model WhatsAppNotification');
    expect(schema).toMatch(/dedupeKey\s+String\s+@unique/);
    expect(migration).toContain('CREATE TABLE "whatsapp_notifications"');
    expect(migration).toContain('whatsapp_notifications_dedupeKey_key');
    expect(migration).toContain('whatsapp_notifications_type_status_createdAt_idx');

    expect(service).toContain('sendWhatsAppText');
    expect(service).toContain('createWhatsAppNotificationDedupeKey');
    expect(service).toContain('notifyPaymentReceivedForOrder');
    expect(service).toContain('notifyPaymentReceivedForManualDeposit');
    expect(service).toContain('notifyTopupSuccessForOrder');
    expect(service).toContain('notifyTopupFailureForOrder');
    expect(service).toContain('sendMarketingWhatsAppBatch');
    expect(service).toContain("status: 'FAILED'");
    expect(service).toContain("status: 'SENT'");

    expect(ordersService).toContain('notifyPaymentReceivedForOrder');
    expect(ordersService).toContain('notifyTopupSuccessForOrder');
    expect(ordersService).toContain('notifyTopupFailureForOrder');
    expect(manualDepositsService).toContain('notifyPaymentReceivedForManualDeposit');
    expect(retryRunner).toContain('notifyTopupSuccessForOrder');
    expect(adminRoute).toContain("requirePermission('WHATSAPP_MARKETING')");
    expect(adminRoute).toContain('sendMarketingWhatsAppBatch');
    expect(adminRoute).toContain("action: 'admin.whatsapp.marketing.send'");
    expect(adminSummary).toContain('whatsappNotifications');
    expect(adminExport).toContain("type === 'whatsapp'");
    expect(validation).toContain('marketingWhatsAppSchema');
  });
});

describe('promotion display rules', () => {
  test('calculates promotion state with an explicit clock', () => {
    expect(getPromotionState('2026-06-01T00:00:00Z', '2026-08-31T23:59:59Z', new Date('2026-06-18T12:00:00Z'))).toBe('live');
    expect(getPromotionState('2026-07-01T00:00:00Z', '2026-08-31T23:59:59Z', new Date('2026-06-18T12:00:00Z'))).toBe('upcoming');
    expect(getPromotionState('2026-05-01T00:00:00Z', '2026-05-31T23:59:59Z', new Date('2026-06-18T12:00:00Z'))).toBe('expired');
  });
});

describe('admin access rules', () => {
  test('loads admin summary for admins and authorized staff users only', () => {
    const admin = { role: 'admin' } as unknown as User;
    const staff = { role: 'staff', staffRole: 'support', staffPermissions: [] } as unknown as User;
    const user = { role: 'user' } as unknown as User;

    expect(shouldLoadAdminSummary(admin)).toBe(true);
    expect(shouldLoadAdminSummary(staff)).toBe(true);
    expect(shouldLoadAdminSummary(user)).toBe(false);
    expect(shouldLoadAdminSummary(null)).toBe(false);
  });

  test('adds staff roles and granular permissions for employee access control', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620180000_add_staff_roles_permissions/migration.sql'),
      'utf8'
    );
    const auth = readFileSync(join(repoRoot, 'src/server/auth.ts'), 'utf8');
    const mapper = readFileSync(join(repoRoot, 'src/server/mappers.ts'), 'utf8');
    const validation = readFileSync(join(repoRoot, 'src/server/validation.ts'), 'utf8');
    const permissionsRoute = readFileSync(join(repoRoot, 'src/app/api/admin/users/[id]/permissions/route.ts'), 'utf8');

    expect(staffPermissions).toContain('ADMIN_DASHBOARD_VIEW');
    expect(staffPermissions).toContain('MANUAL_DEPOSIT_REVIEW');
    expect(staffPermissions).toContain('WHATSAPP_MARKETING');
    expect(staffPermissions).toContain('MONITORING_MANAGE');
    expect(staffRolePermissionMap.FINANCE).toContain('ORDER_REFUND');
    expect(staffRolePermissionMap.OPERATIONS).toContain('MONITORING_MANAGE');
    expect(staffRolePermissionMap.MARKETING).toContain('WHATSAPP_MARKETING');
    expect(hasPermission({ role: 'ADMIN', staffRole: null, staffPermissions: [] }, 'EXPORT_DATA')).toBe(true);
    expect(hasPermission({ role: 'STAFF', staffRole: 'FINANCE', staffPermissions: [] }, 'ORDER_REFUND')).toBe(true);
    expect(hasPermission({ role: 'STAFF', staffRole: 'MARKETING', staffPermissions: [] }, 'ORDER_REFUND')).toBe(false);
    expect(hasPermission({ role: 'STAFF', staffRole: 'VIEWER', staffPermissions: ['ORDER_REFUND'] }, 'ORDER_REFUND')).toBe(true);

    expect(schema).toContain('enum StaffRole');
    expect(schema).toContain('enum StaffPermission');
    expect(schema).toContain('STAFF');
    expect(schema).toMatch(/staffRole\s+StaffRole\?/);
    expect(schema).toMatch(/staffPermissions\s+StaffPermission\[\]\s+@default\(\[\]\)/);
    expect(migration).toContain('CREATE TYPE "StaffRole"');
    expect(migration).toContain('CREATE TYPE "StaffPermission"');
    expect(migration).toContain('ALTER TYPE "UserRole" ADD VALUE');
    expect(migration).toContain('users_staff_role_required_for_staff');
    expect(auth).toContain('requirePermission');
    expect(auth).toContain('hasPermission');
    expect(mapper).toContain('staffRole:');
    expect(mapper).toContain('staffPermissions:');
    expect(validation).toContain('adminUserPermissionsSchema');
    expect(permissionsRoute).toContain("requirePermission('USER_MANAGE')");
    expect(permissionsRoute).toContain("action: 'admin.user.permissions.update'");
  });

  test('records request context for admin audit logs without trusting internal proxy chains', () => {
    const request = new Request('https://alwasl.test/api/admin/summary', {
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.4',
        'cf-connecting-ip': '203.0.113.20',
        'x-real-ip': '203.0.113.30',
        'user-agent': 'audit-test-agent',
      },
    });

    expect(getAuditRequestContext(request)).toEqual({
      ipAddress: '203.0.113.10',
      userAgent: 'audit-test-agent',
    });
  });

  test('database admins and staff are eligible for admin audit writes', () => {
    expect(shouldAuditAdminUser({ role: 'ADMIN' })).toBe(true);
    expect(shouldAuditAdminUser({ role: 'STAFF' })).toBe(true);
    expect(shouldAuditAdminUser({ role: 'USER' })).toBe(false);
  });

  test('admin-sensitive API routes write audit logs', () => {
    const repoRoot = join(import.meta.dir, '..');
    const adminSummaryRoute = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const ordersRoute = readFileSync(join(repoRoot, 'src/app/api/orders/route.ts'), 'utf8');
    const orderDetailRoute = readFileSync(join(repoRoot, 'src/app/api/orders/[id]/route.ts'), 'utf8');
    const orderRefundRoute = readFileSync(join(repoRoot, 'src/app/api/orders/[id]/refund/route.ts'), 'utf8');
    const fakePaymentRoute = readFileSync(join(repoRoot, 'src/app/api/payments/fake/confirm/route.ts'), 'utf8');

    expect(adminSummaryRoute).toContain('recordAdminAuditLog');
    expect(adminSummaryRoute).toContain("action: 'admin.summary.view'");
    expect(adminSummaryRoute).toContain('auditLogs: auditLogs.map(mapAdminAuditLog)');
    expect(ordersRoute).toContain("action: 'orders.list.view'");
    expect(orderDetailRoute).toContain("action: 'orders.detail.view'");
    expect(orderRefundRoute).toContain("action: 'orders.refund'");
    expect(fakePaymentRoute).toContain("action: 'payments.fake.confirm'");
  });
});

describe('auth flow rules', () => {
  test('allows immediate demo OTP verification with an explicit phone override', () => {
    expect(resolveOtpPhone('', '+9647812345678')).toBe('+9647812345678');
    expect(resolveOtpPhone('+964700000001')).toBe('+964700000001');
    expect(resolveOtpPhone('')).toBeNull();
  });
});

describe('auth abuse protection rules', () => {
  test('blocks OTP verification once the attempt limit is reached', () => {
    expect(isOtpAttemptLocked(0)).toBe(false);
    expect(isOtpAttemptLocked(4)).toBe(false);
    expect(nextOtpAttemptCount(4)).toBe(5);
    expect(isOtpAttemptLocked(5)).toBe(true);
  });

  test('treats the persisted rate-limit counter as blocked only after the limit is exceeded', () => {
    expect(isRateLimitExceeded(5, 5)).toBe(false);
    expect(isRateLimitExceeded(6, 5)).toBe(true);
  });
});

describe('server demo auth rules', () => {
  test('never enables demo OTP auth in production, even when env is misconfigured', () => {
    const env = {
      NODE_ENV: 'production',
      ENABLE_DEMO_AUTH: 'true',
      SEED_ADMIN_PHONE: '+9647812345678',
      DEMO_OTP: '123456',
    };

    expect(isDemoAuthEnabled(env)).toBe(false);
    expect(resolveDemoOtpForPhone('+9647812345678', env)).toBeNull();
    expect(isBlockedProductionDemoOtp('+9647812345678', '123456', env)).toBe(true);
    expect(isBlockedProductionDemoOtp('+9647812345678', '999999', { ...env, DEMO_OTP: '999999' })).toBe(true);
    expect(isBlockedProductionDemoOtp('+9647812345678', '123456', { ...env, DEMO_OTP: '999999' })).toBe(true);
    expect(isBlockedProductionDemoOtp('+9647812345678', '654321', env)).toBe(false);
  });

  test('allows demo OTP only when explicitly enabled outside production', () => {
    const env = {
      NODE_ENV: 'development',
      ENABLE_DEMO_AUTH: 'true',
      SEED_ADMIN_PHONE: '+9647812345678',
      DEMO_OTP: '654321',
    };

    expect(isDemoAuthEnabled(env)).toBe(true);
    expect(resolveDemoOtpForPhone('+9647812345678', env)).toBe('654321');
    expect(resolveDemoOtpForPhone('+964700000001', env)).toBeNull();
  });
});

describe('wallet accessibility copy', () => {
  test('provides a description for the wallet top-up dialog', () => {
    expect(walletTopUpDialogCopy.description.en).toContain('wallet balance');
    expect(walletTopUpDialogCopy.description.ar.length).toBeGreaterThan(10);
    expect(walletTopUpDialogCopy.description.zh.length).toBeGreaterThan(5);
  });
});

describe('mobile menu accessibility copy', () => {
  test('provides a description for the mobile navigation sheet', () => {
    expect(mobileMenuSheetCopy.description.en).toContain('navigation');
    expect(mobileMenuSheetCopy.description.ar.length).toBeGreaterThan(10);
    expect(mobileMenuSheetCopy.description.zh.length).toBeGreaterThan(5);
  });
});

describe('WAHO recharge section copy', () => {
  test('keeps the homepage section focused on topping up instead of promoting app features', () => {
    expect(wahoRechargeInfo.title.en).toBe('Before you top up WAHO');
    expect(wahoRechargeInfo.body.en).toContain('only for WAHO account balance');
    expect(wahoRechargeInfo.body.en).toContain('order ID');

    const content = [
      wahoRechargeInfo.title.en,
      wahoRechargeInfo.body.en,
      ...wahoRechargeInfo.cards.flatMap((item) => [item.title.en, item.body.en]),
    ].join(' ');

    expect(content.toLowerCase()).not.toContain('screenshots');
    expect(content.toLowerCase()).not.toContain('live rooms');
    expect(content.toLowerCase()).not.toContain('private chats');
    expect(content.toLowerCase()).not.toContain('virtual gifts');
    expect(content.toLowerCase()).not.toContain('recognize');
    expect(wahoRechargeInfo.cards.map((item) => item.title.en)).toEqual([
      '1. WAHO ID',
      '2. IQD amount',
      '3. Payment',
      '4. Order ID',
    ]);
  });
});

describe('WAHO storefront visual assets', () => {
  test('uses recharge and brand assets instead of app feature screenshots', () => {
    const wahoProduct = games.find((game) => game.slug === 'waho-top-up');
    expect(wahoProduct?.image).toBe('/brand/alwasl-mark.jpg');
    expect(wahoProduct?.banner).toBe('/brand/alwasl-banner.jpg');

    const storefrontImages = [
      wahoProduct?.image,
      wahoProduct?.banner,
      ...banners.filter((banner) => banner.gameId === 'waho-top-up').map((banner) => banner.image),
    ].filter(Boolean);

    expect(storefrontImages.length).toBeGreaterThan(0);
    expect(storefrontImages.every((image) => image?.startsWith('/brand/'))).toBe(true);
    expect(storefrontImages.some((image) => image?.startsWith('/waho/'))).toBe(false);
  });
});

describe('configuration safety rules', () => {
  test('keeps example and documented configuration production-safe by default', () => {
    const repoRoot = join(import.meta.dir, '..');
    const envExample = readFileSync(join(repoRoot, '.env.example'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    const cryptoSource = readFileSync(join(repoRoot, 'src/server/crypto.ts'), 'utf8');

    expect(envExample).toContain('OTP_PEPPER=""');
    expect(envExample).toContain('ENABLE_DEMO_AUTH="false"');
    expect(envExample).toContain('ENABLE_FAKE_PAYMENTS="false"');
    expect(envExample).toContain('ENABLE_MOCK_WAHO="false"');
    expect(envExample).not.toContain('ENABLE_DEMO_AUTH="true"');
    expect(envExample).not.toContain('PAYMENT_MODE="fake"');
    expect(envExample).not.toContain('replace-with-a-long-random');

    expect(readme).not.toContain('PAYMENT_MODE=fake');
    expect(readme).not.toMatch(/OTP:\s*`123456`/i);
    expect(readme).toContain('Local demo OTP login is disabled by default and ignored in production.');

    expect(cryptoSource).not.toContain('dev-otp-pepper');
    expect(cryptoSource).toContain('OTP_SECRET_NOT_CONFIGURED');
  });
});

describe('admin CRUD rules', () => {
  test('persists promotions in the database instead of admin mock data', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migrationPath = join(repoRoot, 'prisma/migrations/20260620110000_add_admin_crud_promotions/migration.sql');
    const migration = readFileSync(migrationPath, 'utf8');
    const seed = readFileSync(join(repoRoot, 'prisma/seed.ts'), 'utf8');
    const adminSummaryRoute = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const publicPromotionsRoute = readFileSync(join(repoRoot, 'src/app/api/promotions/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');

    expect(schema).toContain('model Promotion');
    expect(schema).toContain('code');
    expect(schema).toContain('@unique');
    expect(migration).toContain('CREATE TABLE "promotions"');
    expect(migration).toContain('promotions_code_key');
    expect(seed).toContain('prisma.promotion.upsert');
    expect(adminSummaryRoute).toContain('prisma.promotion.findMany');
    expect(adminSummaryRoute).toContain('mapPromotion');
    expect(publicPromotionsRoute).toContain('prisma.promotion.findMany');
    expect(adminPage).not.toContain("import { promotions");
    expect(adminPage).not.toContain('@/data/mock-data');
  });

  test('persists scheduled banners in the database instead of static banner data', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migrationPath = join(repoRoot, 'prisma/migrations/20260620130000_add_banner_management/migration.sql');
    const migration = readFileSync(migrationPath, 'utf8');
    const seed = readFileSync(join(repoRoot, 'prisma/seed.ts'), 'utf8');
    const mapper = readFileSync(join(repoRoot, 'src/server/mappers.ts'), 'utf8');
    const validation = readFileSync(join(repoRoot, 'src/server/validation.ts'), 'utf8');
    const publicBannersRoute = readFileSync(join(repoRoot, 'src/app/api/banners/route.ts'), 'utf8');
    const adminSummaryRoute = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');
    const homePage = readFileSync(join(repoRoot, 'src/app/page.tsx'), 'utf8');

    expect(schema).toContain('model Banner');
    expect(schema).toContain('@@map("banners")');
    expect(schema).toContain('sortOrder');
    expect(migration).toContain('CREATE TABLE "banners"');
    expect(migration).toContain('banners_isActive_startDate_endDate_sortOrder_idx');
    expect(migration).toContain('CHECK ("endDate" > "startDate")');
    expect(seed).toContain('import { banners');
    expect(seed).toContain('prisma.banner.upsert');
    expect(mapper).toContain('mapBanner');
    expect(validation).toContain('createAdminBannerSchema');
    expect(validation).toContain('updateAdminBannerSchema');
    expect(publicBannersRoute).toContain('prisma.banner.findMany');
    expect(publicBannersRoute).toContain('startDate: { lte: now }');
    expect(publicBannersRoute).toContain('endDate: { gte: now }');
    expect(publicBannersRoute).toContain('banners.map(mapBanner)');
    expect(adminSummaryRoute).toContain('prisma.banner.findMany');
    expect(adminSummaryRoute).toContain('banners: banners.map(mapBanner)');
    expect(homePage).toContain("fetch('/api/banners')");
    expect(homePage).toContain('setBanners');
    expect(homePage).toContain('<HeroBanner banner={');
    expect(adminPage).not.toContain("import { banners");
    expect(adminPage).not.toContain('@/data/mock-data');
  });

  test('persists countries, currencies, and manual exchange rates in the database', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migrationPath = join(repoRoot, 'prisma/migrations/20260620140000_add_currency_exchange_management/migration.sql');
    const migration = readFileSync(migrationPath, 'utf8');
    const seed = readFileSync(join(repoRoot, 'prisma/seed.ts'), 'utf8');
    const mapper = readFileSync(join(repoRoot, 'src/server/mappers.ts'), 'utf8');
    const validation = readFileSync(join(repoRoot, 'src/server/validation.ts'), 'utf8');
    const publicCountriesRoute = readFileSync(join(repoRoot, 'src/app/api/countries/route.ts'), 'utf8');
    const adminSummaryRoute = readFileSync(join(repoRoot, 'src/app/api/admin/summary/route.ts'), 'utf8');
    const appContext = readFileSync(join(repoRoot, 'src/contexts/AppContext.tsx'), 'utf8');
    const authPage = readFileSync(join(repoRoot, 'src/app/auth/page.tsx'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');

    expect(schema).toContain('model Currency');
    expect(schema).toContain('model Country');
    expect(schema).toContain('model ExchangeRate');
    expect(schema).toContain('@@map("currencies")');
    expect(schema).toContain('@@map("countries")');
    expect(schema).toContain('@@map("exchange_rates")');
    expect(migration).toContain('CREATE TABLE "currencies"');
    expect(migration).toContain('CREATE TABLE "countries"');
    expect(migration).toContain('CREATE TABLE "exchange_rates"');
    expect(migration).toContain('CHECK ("rate" > 0)');
    expect(migration).toContain('exchange_rates_baseCurrencyCode_quoteCurrencyCode_key');
    expect(seed).toContain('prisma.currency.upsert');
    expect(seed).toContain('prisma.country.upsert');
    expect(seed).toContain('prisma.exchangeRate.upsert');
    expect(mapper).toContain('mapCountry');
    expect(mapper).toContain('mapExchangeRate');
    expect(validation).toContain('updateAdminCountrySchema');
    expect(validation).toContain('createAdminExchangeRateSchema');
    expect(publicCountriesRoute).toContain('prisma.country.findMany');
    expect(publicCountriesRoute).toContain('prisma.exchangeRate.findMany');
    expect(publicCountriesRoute).toContain('baseCurrencyCode: BASE_CURRENCY');
    expect(adminSummaryRoute).toContain('prisma.country.findMany');
    expect(adminSummaryRoute).toContain('prisma.exchangeRate.findMany');
    expect(adminSummaryRoute).toContain('countries: countries.map');
    expect(adminSummaryRoute).toContain('exchangeRates: exchangeRates.map(mapExchangeRate)');
    expect(appContext).toContain("fetch('/api/countries')");
    expect(appContext).toContain('countries,');
    expect(appContext).not.toContain("import { countries } from '@/data/mock-data'");
    expect(authPage).not.toContain('@/data/mock-data');
    expect(adminPage).toContain("downloadAdminExport('currencies')");
  });

  test('filters products by selected country and persists the country preference', () => {
    const repoRoot = join(import.meta.dir, '..');
    const productsRoute = readFileSync(join(repoRoot, 'src/app/api/products/route.ts'), 'utf8');
    const productRoute = readFileSync(join(repoRoot, 'src/app/api/products/[slug]/route.ts'), 'utf8');
    const appContext = readFileSync(join(repoRoot, 'src/contexts/AppContext.tsx'), 'utf8');
    const homePage = readFileSync(join(repoRoot, 'src/app/page.tsx'), 'utf8');
    const topUpPage = readFileSync(join(repoRoot, 'src/app/top-up/page.tsx'), 'utf8');
    const topUpDetailPage = readFileSync(join(repoRoot, 'src/app/top-up/[slug]/page.tsx'), 'utf8');
    const promotionsPage = readFileSync(join(repoRoot, 'src/app/promotions/page.tsx'), 'utf8');
    const settingsPage = readFileSync(join(repoRoot, 'src/app/settings/page.tsx'), 'utf8');

    expect(productsRoute).toContain('request.nextUrl.searchParams.get');
    expect(productsRoute).toContain('countries: { has: countryId }');
    expect(productRoute).toContain('request.nextUrl.searchParams.get');
    expect(productRoute).toContain('countries: { has: countryId }');
    expect(appContext).not.toContain('localStorage.removeItem(storageKeys.country)');
    expect(appContext).toContain('localStorage.setItem(storageKeys.country, country.id)');
    expect(appContext).toContain('const savedCountryId = localStorage.getItem(storageKeys.country)');
    expect(homePage).toContain('selectedCountry.id');
    expect(homePage).toContain('country=${selectedCountry.id}');
    expect(topUpPage).toContain('selectedCountry.id');
    expect(topUpPage).toContain('country=${selectedCountry.id}');
    expect(topUpDetailPage).toContain('selectedCountry.id');
    expect(topUpDetailPage).toContain('country=${selectedCountry.id}');
    expect(promotionsPage).toContain('selectedCountry.id');
    expect(promotionsPage).toContain('country=${selectedCountry.id}');
    expect(settingsPage).toContain('setSelectedCountry');
    expect(settingsPage).toContain('countries.map');
  });

  test('exposes admin-only audited mutation routes for visible dashboard actions', () => {
    const repoRoot = join(import.meta.dir, '..');
    const routeContracts = [
      ['src/app/api/admin/topup-packages/route.ts', ['export async function POST', 'createAdminTopupPackageSchema', 'prisma.topupPackage.create', "action: 'admin.topup_package.create'"]],
      ['src/app/api/admin/topup-packages/[id]/route.ts', ['export async function PATCH', 'updateAdminTopupPackageSchema', 'prisma.topupPackage.update', "action: 'admin.topup_package.update'"]],
      ['src/app/api/admin/products/route.ts', ['export async function POST', 'createAdminProductSchema', 'prisma.product.create', "action: 'admin.product.create'"]],
      ['src/app/api/admin/products/[id]/route.ts', ['export async function PATCH', 'updateAdminProductSchema', 'prisma.product.update', "action: 'admin.product.update'"]],
      ['src/app/api/admin/providers/route.ts', ['export async function POST', 'createAdminProviderAccountSchema', 'prisma.providerAccount.create', "action: 'admin.provider_account.create'"]],
      ['src/app/api/admin/providers/[id]/route.ts', ['export async function PATCH', 'updateAdminProviderAccountSchema', 'prisma.providerAccount.update', "action: 'admin.provider_account.update'"]],
      ['src/app/api/admin/promotions/route.ts', ['export async function POST', 'createAdminPromotionSchema', 'prisma.promotion.create', "action: 'admin.promotion.create'"]],
      ['src/app/api/admin/promotions/[id]/route.ts', ['export async function PATCH', 'updateAdminPromotionSchema', 'prisma.promotion.update', "action: 'admin.promotion.update'"]],
      ['src/app/api/admin/pricing-rules/route.ts', ['export async function POST', 'createAdminCustomPricingRuleSchema', 'prisma.customPricingRule.create', "action: 'admin.pricing_rule.create'"]],
      ['src/app/api/admin/pricing-rules/[id]/route.ts', ['export async function PATCH', 'updateAdminCustomPricingRuleSchema', 'prisma.customPricingRule.update', "action: 'admin.pricing_rule.update'"]],
      ['src/app/api/admin/banners/route.ts', ['export async function POST', 'createAdminBannerSchema', 'prisma.banner.create', "action: 'admin.banner.create'"]],
      ['src/app/api/admin/banners/[id]/route.ts', ['export async function PATCH', 'updateAdminBannerSchema', 'prisma.banner.update', "action: 'admin.banner.update'"]],
      ['src/app/api/admin/countries/[id]/route.ts', ['export async function PATCH', 'updateAdminCountrySchema', 'prisma.country.update', "action: 'admin.country.update'"]],
      ['src/app/api/admin/exchange-rates/route.ts', ['export async function POST', 'createAdminExchangeRateSchema', 'prisma.exchangeRate.upsert', "action: 'admin.exchange_rate.upsert'"]],
      ['src/app/api/admin/users/[id]/account-type/route.ts', ['export async function PATCH', 'adminUserAccountTypeSchema', 'prisma.user.update', "action: 'admin.user.account_type.update'"]],
      ['src/app/api/admin/users/[id]/permissions/route.ts', ['export async function PATCH', 'adminUserPermissionsSchema', 'prisma.user.update', "action: 'admin.user.permissions.update'"]],
      ['src/app/api/admin/manual-deposits/[id]/route.ts', ['export async function PATCH', 'reviewManualDepositSchema', 'reviewManualDeposit', "action: 'admin.manual_deposit.review'"]],
      ['src/app/api/admin/export/route.ts', ['export async function GET', 'adminExportSchema', 'Content-Disposition', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "action: 'admin.export'"]],
    ] as const;

    for (const [file, expectedSnippets] of routeContracts) {
      const routePath = join(repoRoot, file);
      expect(existsSync(routePath), `${file} should exist`).toBe(true);
      const source = readFileSync(routePath, 'utf8');
      expect(source).toMatch(/require(Admin|Permission)/);
      expect(source).toContain('recordAdminAuditLog');
      for (const snippet of expectedSnippets) {
        expect(source, `${file} should contain ${snippet}`).toContain(snippet);
      }
    }
  });

  test('wires admin controls to backend mutations and export downloads', () => {
    const repoRoot = join(import.meta.dir, '..');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');

    for (const handler of [
      'createTopupPackage',
      'createProduct',
      'updateTopupPackage',
      'toggleProductActive',
      'createProviderAccount',
      'toggleProviderActive',
      'createPromotion',
      'togglePromotionActive',
      'createCustomPricingRule',
      'updateCustomPricingRule',
      'createBanner',
      'toggleBannerActive',
      'updateExchangeRate',
      'toggleCountryActive',
      'updateUserAccountType',
      'updateUserPermissions',
      'downloadAdminExport',
      'reloadSummary',
    ]) {
      expect(adminPage).toContain(handler);
    }

    expect(adminPage).toContain("adminJsonRequest('/api/admin/topup-packages'");
    expect(adminPage).toContain("adminJsonRequest('/api/admin/products'");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/products/${productId}`");
    expect(adminPage).toContain("adminJsonRequest('/api/admin/providers'");
    expect(adminPage).toContain("adminJsonRequest('/api/admin/promotions'");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/promotions/${promotionId}`");
    expect(adminPage).toContain("adminJsonRequest('/api/admin/pricing-rules'");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/pricing-rules/${ruleId}`");
    expect(adminPage).toContain("adminJsonRequest('/api/admin/banners'");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/banners/${bannerId}`");
    expect(adminPage).toContain("adminJsonRequest('/api/admin/exchange-rates'");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/countries/${countryId}`");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/users/${userId}/account-type`");
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/users/${userId}/permissions`");
    expect(adminPage).toContain("fetch(`/api/admin/export?type=${type}`");
    expect(adminPage).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(adminPage).toContain('.xlsx');
    expect(adminPage).toContain("downloadAdminExport('banners')");
    expect(adminPage).toContain("downloadAdminExport('currencies')");
    expect(adminPage).toContain("downloadAdminExport('pricing')");
    expect(adminPage).toContain('onCheckedChange');
    expect(adminPage).not.toContain('<Switch defaultChecked />');
  });
});

describe('Excel export rules', () => {
  test('generates a real XLSX workbook, not a CSV download', async () => {
    const repoRoot = join(import.meta.dir, '..');
    const route = readFileSync(join(repoRoot, 'src/app/api/admin/export/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');
    const packageJson = readFileSync(join(repoRoot, 'package.json'), 'utf8');

    const workbook = await createExcelWorkbookBuffer({
      sheetName: 'Promotions',
      rows: [
        {
          code: 'WAHO10',
          type: 'PERCENTAGE',
          value: 10,
          isActive: true,
        },
      ],
    });

    expect(workbook.subarray(0, 2).toString()).toBe('PK');
    expect(workbook.length).toBeGreaterThan(3000);
    expect(packageJson).toContain('"exceljs"');
    expect(route).toContain('createExcelWorkbookBuffer');
    expect(route).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(route).toContain('.xlsx');
    expect(route).toContain("type === 'banners'");
    expect(route).toContain("type === 'currencies'");
    expect(route).not.toContain('text/csv');
    expect(adminPage).toContain('alwasl-${type}.xlsx');
  });
});

describe('reporting engine rules', () => {
  test('builds daily, weekly, monthly, and yearly reporting ranges', () => {
    const daily = getReportRange('daily', new Date('2026-06-20T12:34:00.000Z'));
    expect(daily.from.toISOString()).toBe('2026-06-20T00:00:00.000Z');
    expect(daily.to.toISOString()).toBe('2026-06-21T00:00:00.000Z');

    const weeklyBuckets = createReportBuckets(
      'weekly',
      new Date('2026-06-01T10:00:00.000Z'),
      new Date('2026-06-15T00:00:00.000Z')
    );
    expect(weeklyBuckets.map((bucket) => bucket.key)).toEqual(['2026-W23', '2026-W24']);

    const monthlyBuckets = createReportBuckets(
      'monthly',
      new Date('2026-01-15T00:00:00.000Z'),
      new Date('2026-04-01T00:00:00.000Z')
    );
    expect(monthlyBuckets.map((bucket) => bucket.key)).toEqual(['2026-01', '2026-02', '2026-03']);

    const yearlyBuckets = createReportBuckets(
      'yearly',
      new Date('2025-05-01T00:00:00.000Z'),
      new Date('2027-06-01T00:00:00.000Z')
    );
    expect(yearlyBuckets.map((bucket) => bucket.key)).toEqual(['2025', '2026', '2027']);
  });

  test('summarizes report bucket metrics for finance and operations', () => {
    const summary = summarizeReportBuckets([
      {
        key: '2026-06-20',
        label: '20 Jun',
        start: '2026-06-20T00:00:00.000Z',
        end: '2026-06-21T00:00:00.000Z',
        orders: 3,
        completedOrders: 2,
        failedOrders: 1,
        refundedOrders: 0,
        revenue: 25_000,
        walletRevenue: 10_000,
        externalPaymentRevenue: 15_000,
        manualDeposits: 2,
        manualDepositAmount: 50_000,
        newUsers: 4,
      },
      {
        key: '2026-06-21',
        label: '21 Jun',
        start: '2026-06-21T00:00:00.000Z',
        end: '2026-06-22T00:00:00.000Z',
        orders: 1,
        completedOrders: 1,
        failedOrders: 0,
        refundedOrders: 1,
        revenue: 15_000,
        walletRevenue: 15_000,
        externalPaymentRevenue: 0,
        manualDeposits: 1,
        manualDepositAmount: 20_000,
        newUsers: 1,
      },
    ]);

    expect(summary).toMatchObject({
      orders: 4,
      completedOrders: 3,
      failedOrders: 1,
      refundedOrders: 1,
      revenue: 40_000,
      walletRevenue: 25_000,
      externalPaymentRevenue: 15_000,
      manualDeposits: 3,
      manualDepositAmount: 70_000,
      newUsers: 5,
      avgOrderValue: 13_333,
    });
  });

  test('exposes audited admin report APIs and connects the dashboard UI to them', () => {
    const repoRoot = join(import.meta.dir, '..');
    const service = readFileSync(join(repoRoot, 'src/server/services/reports.ts'), 'utf8');
    const reportRoute = readFileSync(join(repoRoot, 'src/app/api/admin/reports/route.ts'), 'utf8');
    const exportRoute = readFileSync(join(repoRoot, 'src/app/api/admin/reports/export/route.ts'), 'utf8');
    const validation = readFileSync(join(repoRoot, 'src/server/validation.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');

    for (const snippet of [
      'buildReport',
      'createReportBuckets',
      'summarizeReportBuckets',
      'prisma.order.findMany',
      'prisma.manualDeposit.findMany',
      'prisma.user.findMany',
      'manualDepositAmount',
    ]) {
      expect(service).toContain(snippet);
    }

    expect(reportRoute).toContain("requirePermission('ADMIN_DASHBOARD_VIEW')");
    expect(reportRoute).toContain('reportQuerySchema');
    expect(reportRoute).toContain('buildReport');
    expect(reportRoute).toContain("action: 'admin.report.view'");

    expect(exportRoute).toContain("requirePermission('EXPORT_DATA')");
    expect(exportRoute).toContain('adminReportExportSchema');
    expect(exportRoute).toContain('createExcelWorkbookBuffer');
    expect(exportRoute).toContain("action: 'admin.report.export'");
    expect(exportRoute).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    expect(validation).toContain('reportQuerySchema');
    expect(validation).toContain('adminReportExportSchema');
    expect(validation).toContain("z.enum(['daily', 'weekly', 'monthly', 'yearly'])");

    expect(adminPage).toContain('/api/admin/reports?');
    expect(adminPage).toContain('/api/admin/reports/export?');
    expect(adminPage).toContain('downloadAdminReportExport');
    expect(adminPage).toContain('reportPeriod');
  });
});

describe('mobile API contract rules', () => {
  test('documents the native-app API contract with OpenAPI and explicit mobile boundaries', () => {
    const repoRoot = join(import.meta.dir, '..');
    const openApiPath = join(repoRoot, 'docs/openapi.yaml');
    const contractPath = join(repoRoot, 'docs/mobile-api-contract.md');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

    expect(existsSync(openApiPath)).toBe(true);
    expect(existsSync(contractPath)).toBe(true);

    const spec = readFileSync(openApiPath, 'utf8');
    const contract = readFileSync(contractPath, 'utf8');

    for (const snippet of [
      'openapi: 3.1.0',
      'Al-Wasl Digital WAHO Mobile API',
      'SessionCookie',
      'alwasl_session',
      'Idempotency-Key',
      'ORDER_CONFIRMATION',
      'WALLET_TOP_UP',
      '/api/auth/login',
      '/api/auth/verify',
      '/api/auth/me',
      '/api/auth/logout',
      '/api/auth/otp/request',
      '/api/products',
      '/api/products/{slug}',
      '/api/waho/verify',
      '/api/orders',
      '/api/orders/{id}',
      '/api/wallet',
      '/api/wallet/manual-deposits',
      '/api/countries',
      '/api/banners',
      '/api/promotions',
    ]) {
      expect(spec).toContain(snippet);
    }

    expect(spec).not.toContain('/api/payments/fake/confirm');
    expect(spec).not.toContain('/api/admin/summary');
    expect(contract).toContain('Native clients must not assume bearer-token auth');
    expect(contract).toContain('Fake payment routes');
    expect(contract).toContain('Idempotency-Replayed: true');
    expect(readme).toContain('docs/openapi.yaml');
    expect(readme).toContain('docs/mobile-api-contract.md');
  });
});

describe('database backup operations rules', () => {
  test('documents and verifies cloud automated database backups from the repo', () => {
    const repoRoot = join(import.meta.dir, '..');
    const backupRunbookPath = join(repoRoot, 'docs/database-backups.md');
    const backupScriptPath = join(repoRoot, 'scripts/verify-digitalocean-backups.ts');
    const envExample = readFileSync(join(repoRoot, '.env.example'), 'utf8');
    const packageJson = readFileSync(join(repoRoot, 'package.json'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

    expect(existsSync(backupRunbookPath)).toBe(true);
    expect(existsSync(backupScriptPath)).toBe(true);

    const runbook = readFileSync(backupRunbookPath, 'utf8');
    const script = readFileSync(backupScriptPath, 'utf8');

    for (const snippet of [
      'DigitalOcean Managed PostgreSQL',
      'automated cloud backups',
      'point-in-time recovery',
      'bun run ops:check-backups',
      'DO_DATABASE_CLUSTER_ID',
      'BACKUP_MAX_AGE_HOURS',
      'Restore Drill',
      'Incident Restore Procedure',
      'doctl databases backups',
      'https://docs.digitalocean.com/products/databases/postgresql/how-to/restore-from-backups/',
    ]) {
      expect(runbook).toContain(snippet);
    }

    expect(script).toContain('doctl');
    expect(script).toContain('databases');
    expect(script).toContain('backups');
    expect(script).toContain('DO_DATABASE_CLUSTER_ID');
    expect(script).toContain('BACKUP_MAX_AGE_HOURS');
    expect(script).toContain('Latest backup is older than');
    expect(envExample).toContain('DO_DATABASE_CLUSTER_ID=""');
    expect(envExample).toContain('BACKUP_MAX_AGE_HOURS="30"');
    expect(packageJson).toContain('"ops:check-backups"');
    expect(readme).toContain('docs/database-backups.md');
    expect(readme).toContain('bun run ops:check-backups');
  });
});

describe('contract deliverables rules', () => {
  test('documents timeline, milestones, six-month support, warranty, and handover deliverables', () => {
    const repoRoot = join(import.meta.dir, '..');
    const deliverablesPath = join(repoRoot, 'docs/contract-deliverables.md');
    const timelinePath = join(repoRoot, 'docs/project-timeline.md');
    const supportPath = join(repoRoot, 'docs/support-warranty.md');
    const handoverPath = join(repoRoot, 'docs/handover.md');
    const ownershipPath = join(repoRoot, 'docs/technical-ownership.md');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

    for (const filePath of [deliverablesPath, timelinePath, supportPath, handoverPath, ownershipPath]) {
      expect(existsSync(filePath)).toBe(true);
    }

    const deliverables = readFileSync(deliverablesPath, 'utf8');
    const timeline = readFileSync(timelinePath, 'utf8');
    const support = readFileSync(supportPath, 'utf8');
    const handover = readFileSync(handoverPath, 'utf8');

    for (const snippet of [
      'Deliverable Register',
      'Formal Acceptance Package',
      'signed acceptance date',
      'six-month support and warranty period',
      'Known Deferred Items',
      'Change Control',
    ]) {
      expect(deliverables).toContain(snippet);
    }

    for (const snippet of [
      'Project Timeline and Milestones',
      'Milestone Summary',
      'M1 Discovery and scope lock',
      'M8 Handover and acceptance',
      'Acceptance Gate',
      'Post-Acceptance Support Timeline',
    ]) {
      expect(timeline).toContain(snippet);
    }

    for (const snippet of [
      'Support and Warranty',
      'six months from the signed production acceptance date',
      'Warranty Coverage',
      'Not covered as warranty',
      'Response Targets',
      'End of Warranty',
    ]) {
      expect(support).toContain(snippet);
    }

    for (const snippet of [
      'Handover Documentation',
      'Required Access',
      'Environment Variables',
      'Scheduled Jobs',
      'Smoke Test After Deployment',
      'Handover Sign-Off',
    ]) {
      expect(handover).toContain(snippet);
    }

    expect(readme).toContain('docs/contract-deliverables.md');
    expect(readme).toContain('docs/project-timeline.md');
    expect(readme).toContain('docs/support-warranty.md');
    expect(readme).toContain('docs/handover.md');
    expect(readme).toContain('docs/technical-ownership.md');
  });
});

describe('technical ownership rules', () => {
  test('documents customer-owned technical assets and provides machine-checkable ownership signals', () => {
    const repoRoot = join(import.meta.dir, '..');
    const ownershipPath = join(repoRoot, 'docs/technical-ownership.md');
    const scriptPath = join(repoRoot, 'scripts/verify-operational-ownership.ts');
    const envExample = readFileSync(join(repoRoot, '.env.example'), 'utf8');
    const packageJson = readFileSync(join(repoRoot, 'package.json'), 'utf8');
    const handover = readFileSync(join(repoRoot, 'docs/handover.md'), 'utf8');
    const deliverables = readFileSync(join(repoRoot, 'docs/contract-deliverables.md'), 'utf8');

    expect(existsSync(ownershipPath)).toBe(true);
    expect(existsSync(scriptPath)).toBe(true);

    const ownership = readFileSync(ownershipPath, 'utf8');
    const script = readFileSync(scriptPath, 'utf8');

    for (const snippet of [
      'Technical ownership cannot be proven from source code alone',
      'Required Customer-Owned Assets',
      'GitHub repository',
      'DigitalOcean account/team',
      'Domain and DNS',
      'WAHA / WhatsApp sending account',
      'WAHO API credentials',
      'Payment provider credentials',
      'Machine-Verifiable Checks',
      'Required Manual Attestations',
      'Secret Custody Rules',
      'Ownership Sign-Off',
    ]) {
      expect(ownership).toContain(snippet);
    }

    for (const snippet of [
      'OWNERSHIP_CUSTOMER_LEGAL_NAME',
      'OWNERSHIP_EXPECTED_DIGITALOCEAN_ACCOUNT_EMAIL',
      'DO_APP_ID',
      'DO_DATABASE_CLUSTER_ID',
      'OWNERSHIP_EXPECTED_GITHUB_OWNER',
      'OWNERSHIP_CUSTOMER_DOMAIN',
      'OWNERSHIP_EXPECTED_DOMAIN_TARGET',
      'doctl',
      'apps',
      'databases',
      'dig',
      'Machine-verifiable checks passed',
      'Manual legal ownership and API-key custody attestations are still required',
    ]) {
      expect(script).toContain(snippet);
    }

    for (const key of [
      'DO_APP_ID=""',
      'OWNERSHIP_CUSTOMER_LEGAL_NAME=""',
      'OWNERSHIP_EXPECTED_DIGITALOCEAN_ACCOUNT_EMAIL=""',
      'OWNERSHIP_EXPECTED_GITHUB_OWNER=""',
      'OWNERSHIP_CUSTOMER_DOMAIN=""',
      'OWNERSHIP_EXPECTED_DOMAIN_TARGET=""',
    ]) {
      expect(envExample).toContain(key);
    }

    expect(packageJson).toContain('"ops:check-ownership"');
    expect(handover).toContain('Technical Ownership Verification');
    expect(handover).toContain('bun run ops:check-ownership');
    expect(deliverables).toContain('Technical ownership and account custody evidence');
  });
});

describe('WAHO-first catalog scope rules', () => {
  test('documents and implements WAHO-first catalog expansion without exposing unsupported products', () => {
    const repoRoot = join(import.meta.dir, '..');
    const scopeDeviationPath = join(repoRoot, 'docs/scope-deviations.md');
    const deliverables = readFileSync(join(repoRoot, 'docs/contract-deliverables.md'), 'utf8');
    const timeline = readFileSync(join(repoRoot, 'docs/project-timeline.md'), 'utf8');
    const handover = readFileSync(join(repoRoot, 'docs/handover.md'), 'utf8');
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const enumMigration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620200000_add_waho_first_catalog_scope/migration.sql'),
      'utf8'
    );
    const categoryMigration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620201000_set_waho_topup_category/migration.sql'),
      'utf8'
    );
    const adminProductsRoute = readFileSync(join(repoRoot, 'src/app/api/admin/products/route.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');

    expect(existsSync(scopeDeviationPath)).toBe(true);

    const scopeDeviation = readFileSync(scopeDeviationPath, 'utf8');

    for (const snippet of [
      'WAHO-First Catalog Scope',
      'multiple games, apps, products, categories',
      'The production launch remains focused on WAHO account top-ups',
      'no longer hardcoded as a WAHO-only technical scope',
      'Newly created products are inactive by default',
      'SC-001',
      'Multiple games/apps/products/categories can be offered',
      'Catalog infrastructure and admin product creation are implemented',
      'Implemented as WAHO-first',
      'Before making a non-WAHO product active',
      'Written approval before production exposure',
    ]) {
      expect(scopeDeviation).toContain(snippet);
    }

    const parsedProduct = createAdminProductSchema.parse({
      slug: 'future-wallet-top-up',
      name: 'Future Wallet Top-Up',
      nameAr: 'شحن محفظة مستقبلية',
      description: 'Future inactive product for catalog expansion.',
      descriptionAr: 'منتج مستقبلي غير نشط لتوسيع الكتالوج.',
    });
    expect(parsedProduct).toMatchObject({
      category: 'TOP_UP',
      isActive: false,
      countries: ['iq'],
    });

    expect(schema).toContain('TOP_UP');
    expect(schema).toContain('APP');
    expect(schema).toContain('GAME');
    expect(enumMigration).toContain("'TOP_UP'");
    expect(categoryMigration).toContain("UPDATE \"products\"");
    expect(categoryMigration).toContain("'TOP_UP'");
    expect(adminProductsRoute).toContain('createAdminProductSchema');
    expect(adminProductsRoute).toContain('isActive: body.isActive');
    expect(adminPage).toContain('WAHO-first catalog');
    expect(adminPage).toContain('setProductDialogOpen(true)');
    expect(adminPage).toContain('New products are inactive by default');
    expect(games).toHaveLength(1);
    expect(games[0].slug).toBe('waho-top-up');
    expect(deliverables).toContain('WAHO-first catalog scope and expansion policy');
    expect(deliverables).toContain('Public activation of non-WAHO products before provider routing');
    expect(timeline).toContain('docs/scope-deviations.md');
    expect(timeline).toContain('WAHO-first top-up launch scope');
    expect(handover).toContain('Catalog scope record confirms WAHO is the launch focus');
    expect(readme).toContain('docs/scope-deviations.md');
  });
});

describe('customer blocking rules', () => {
  test('stores customer block state, reason, timestamp, and blocking admin', () => {
    const repoRoot = join(import.meta.dir, '..');
    const schema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
    const migration = readFileSync(
      join(repoRoot, 'prisma/migrations/20260620120000_add_customer_blocking/migration.sql'),
      'utf8'
    );
    const mapper = readFileSync(join(repoRoot, 'src/server/mappers.ts'), 'utf8');
    const types = readFileSync(join(repoRoot, 'src/types/index.ts'), 'utf8');

    expect(schema).toContain('isBlocked         Boolean');
    expect(schema).toContain('blockedReason     String?');
    expect(schema).toContain('blockedAt         DateTime?');
    expect(schema).toContain('blockedByAdminId  String?');
    expect(schema).toContain('@@index([isBlocked, phone])');
    expect(migration).toContain('ALTER TABLE "users" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false');
    expect(migration).toContain('users_blockedByAdminId_fkey');
    expect(mapper).toContain('isBlocked: user.isBlocked');
    expect(types).toContain('isBlocked: boolean');
    expect(types).toContain('blockedReason?: string');
  });

  test('blocks OTP login, verification, and existing authenticated sessions', () => {
    const repoRoot = join(import.meta.dir, '..');
    const auth = readFileSync(join(repoRoot, 'src/server/auth.ts'), 'utf8');
    const loginRoute = readFileSync(join(repoRoot, 'src/app/api/auth/login/route.ts'), 'utf8');
    const verifyRoute = readFileSync(join(repoRoot, 'src/app/api/auth/verify/route.ts'), 'utf8');
    const meRoute = readFileSync(join(repoRoot, 'src/app/api/auth/me/route.ts'), 'utf8');
    const http = readFileSync(join(repoRoot, 'src/server/http.ts'), 'utf8');

    expect(auth).toContain('assertUserNotBlocked');
    expect(auth).toContain('USER_BLOCKED');
    expect(auth).toContain('revokedAt');
    expect(loginRoute).toContain('assertPhoneNotBlocked(phone)');
    expect(verifyRoute).toContain('assertPhoneNotBlocked(phone)');
    expect(meRoute).toContain('assertUserNotBlocked(user)');
    expect(http).toContain("USER_BLOCKED: { message: 'Account is blocked'");
  });

  test('exposes an audited admin route and UI switch to block phone numbers', () => {
    const repoRoot = join(import.meta.dir, '..');
    const routePath = join(repoRoot, 'src/app/api/admin/users/[id]/block/route.ts');
    const route = readFileSync(routePath, 'utf8');
    const validation = readFileSync(join(repoRoot, 'src/server/validation.ts'), 'utf8');
    const adminPage = readFileSync(join(repoRoot, 'src/app/admin/page.tsx'), 'utf8');
    const exportRoute = readFileSync(join(repoRoot, 'src/app/api/admin/export/route.ts'), 'utf8');

    expect(existsSync(routePath)).toBe(true);
    expect(route).toContain('requirePermission');
    expect(route).toContain("requirePermission('USER_MANAGE')");
    expect(route).toContain('adminUserBlockSchema');
    expect(route).toContain('prisma.user.update');
    expect(route).toContain('prisma.session.updateMany');
    expect(route).toContain("action: 'admin.user.block.update'");
    expect(validation).toContain('adminUserBlockSchema');
    expect(adminPage).toContain('toggleUserBlocked');
    expect(adminPage).toContain("adminJsonRequest(`/api/admin/users/${userId}/block`");
    expect(adminPage).toContain('Blocked');
    expect(exportRoute).toContain('isBlocked: user.isBlocked');
    expect(exportRoute).toContain('blockedReason: user.blockedReason');
  });
});

describe('customer-facing copy quality', () => {
  test('keeps public pages free from internal demo and placeholder language', () => {
    const repoRoot = join(import.meta.dir, '..');
    const customerFacingFiles = [
      'src/app/about/page.tsx',
      'src/app/contact/page.tsx',
      'src/app/faq/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/terms/page.tsx',
      'src/app/promotions/page.tsx',
      'src/app/page.tsx',
      'src/app/top-up/[slug]/page.tsx',
      'src/app/auth/page.tsx',
      'src/app/wallet/page.tsx',
      'src/app/wallet/wallet-dialog-copy.ts',
    ];
    const bannedPatterns = [
      /\/api\/payments\/fake\/confirm/i,
      /fake payment/i,
      /current release/i,
      /demo-ready/i,
      /placeholder policy/i,
      /demo terms/i,
      /sample data/i,
      /simulated flows/i,
      /most demo orders/i,
      /demo support/i,
      /use these demo offers/i,
      /Demo Mode:/i,
      /Use Demo Account/i,
      /Use test account/i,
      /Test account opened/i,
      /OTP 123456/i,
      /ready for a quick WAHO top-up/i,
      /customers who know LEO.*recognize/i,
      /LEO is highlighted/i,
    ];

    for (const file of customerFacingFiles) {
      const source = readFileSync(join(repoRoot, file), 'utf8');
      for (const pattern of bannedPatterns) {
        expect(source, `${file} should not contain ${pattern}`).not.toMatch(pattern);
      }
    }

    expect(existsSync(join(repoRoot, 'src/app/demo/page.tsx'))).toBe(false);
  });
});

describe('mappers', () => {
  test('maps the database role and resolves membership from total spend', () => {
    const mapped = mapUser({
      id: 'user-1',
      phone: '+9647812345678',
      name: 'Admin',
      email: null,
      avatar: null,
      role: 'ADMIN',
      staffRole: null,
      staffPermissions: [],
      accountType: 'CUSTOMER',
      level: 'GOLD',
      walletBalance: 250000,
      totalSpent: 0,
      isVerified: true,
      discountPercentage: 5,
      isBlocked: true,
      blockedReason: 'chargeback abuse',
      blockedAt: new Date('2026-06-18T11:30:00Z'),
      blockedByAdminId: 'admin-1',
      registeredAt: new Date('2026-06-18T10:00:00Z'),
      lastLogin: new Date('2026-06-18T11:00:00Z'),
    });

    expect(mapped.role).toBe('admin');
    expect(mapped.level).toBe('bronze');
    expect(mapped.discountPercentage).toBe(0);
    expect(mapped.isBlocked).toBe(true);
    expect(mapped.blockedReason).toBe('chargeback abuse');
  });
});
