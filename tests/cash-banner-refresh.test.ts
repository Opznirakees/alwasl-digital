import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createOrderSchema } from '../src/server/validation';
import { isOrderPaymentMethodEnabled } from '../src/server/payment-policy';

const root = join(import.meta.dir, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('cash-only customer checkout', () => {
  test('accepts cash orders in production while QiCard remains opt-in and hidden', () => {
    expect(createOrderSchema.parse({
      productSlug: 'waho-top-up',
      packageId: 'waho-topup-10000',
      wahoId: 'WAHO-123',
      paymentMethod: 'cash',
      otp: '123456',
    }).paymentMethod).toBe('cash');

    expect(isOrderPaymentMethodEnabled('cash' as never, { NODE_ENV: 'production' })).toBe(true);

    const methodsRoute = read('src/app/api/payments/methods/route.ts');
    const checkout = read('src/app/top-up/[slug]/page.tsx');
    expect(methodsRoute).toContain("{ id: 'cash', enabled: true }");
    expect(methodsRoute).not.toContain("id: 'qicard'");
    expect(checkout).toContain("id: 'cash'");
    expect(checkout).not.toContain("id: 'qicard'");
    expect(checkout).toContain("t('Cash payment', 'الدفع نقداً', '现金支付')");
  });

  test('provides an audited admin action to confirm received cash', () => {
    const schema = read('prisma/schema.prisma');
    const route = read('src/app/api/admin/orders/[id]/cash-payment/route.ts');
    const service = read('src/server/services/orders.ts');
    expect(schema).toContain('CASH');
    expect(route).toContain("requirePermission('ORDER_MANAGE')");
    expect(route).toContain('confirmCashPayment');
    expect(route).toContain('admin.order.cash_payment.confirm');
    expect(service).toContain("hasPermission(user, 'ORDER_MANAGE')");
  });
});

describe('localized campaign banners', () => {
  test('stores English, Arabic and Chinese banner copy as first-class fields', () => {
    const schema = read('prisma/schema.prisma');
    const types = read('src/types/index.ts');
    const mapper = read('src/server/mappers.ts');
    const admin = read('src/app/admin/page.tsx');

    expect(schema).toContain('titleZh');
    expect(schema).toContain('subtitleZh');
    expect(types).toContain('titleZh: string');
    expect(types).toContain('subtitleZh?: string');
    expect(mapper).toContain('titleZh: banner.titleZh');
    expect(admin).toContain('banner-title-zh');
    expect(admin).toContain('banner-subtitle-zh');
  });

  test('ships both supplied campaign artworks with reviewed translations', () => {
    expect(existsSync(join(root, 'public/banners/waho-fast-blue.jpeg'))).toBe(true);
    expect(existsSync(join(root, 'public/banners/waho-offers-red.jpeg'))).toBe(true);

    const seeds = read('src/data/mock-data.ts');
    expect(seeds).toContain("id: 'campaign-waho-fast-blue'");
    expect(seeds).toContain("title: 'Al-Wasl Digital for WAHO Top-Ups'");
    expect(seeds).toContain("titleZh: 'Al-Wasl 数字服务 · WAHO 充值'");
    expect(seeds).toContain("subtitleZh: '快速充值，安全支付，正规注册企业。'");
    expect(seeds).toContain("id: 'campaign-waho-offers-red'");
    expect(seeds).toContain("title: 'Promotional WAHO top-up offers'");
    expect(seeds).toContain("titleZh: 'WAHO 充值优惠'");
  });

  test('renders translated banner text instead of falling back to English', () => {
    const hero = read('src/components/home/HeroBanner.tsx');
    expect(hero).toContain('active.titleZh');
    expect(hero).toContain('active.subtitleZh');
    expect(hero).toContain('data-campaign-banner');
  });
});

describe('brand and support details', () => {
  test('uses the official Asiacell logo and the new WhatsApp contact', () => {
    const officialLogo = '/brands/asiacell-official.svg';
    expect(read('src/data/mock-data.ts')).toContain(officialLogo);
    expect(read('prisma/seed.ts')).toContain(officialLogo);

    const logo = readFileSync(join(root, 'public/brands/asiacell-official.svg'));
    expect(createHash('sha1').update(logo).digest('hex')).toBe(
      'f648dcbe52c6924c6efe420979cfc891d33339c1'
    );

    const contact = read('src/config/contact.ts');
    expect(contact).toContain("supportWhatsAppNumber = '07842222556'");
    expect(contact).toContain("supportWhatsAppNormalizedNumber = '9647842222556'");
  });
});
