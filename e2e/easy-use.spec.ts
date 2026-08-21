import { expect, test, type Page, type Route } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const product = {
  id: 'waho-top-up',
  slug: 'waho-top-up',
  name: 'WAHO Account Top-Up',
  nameAr: 'شحن حساب WAHO',
  description: 'Top up a WAHO account balance.',
  descriptionAr: 'اشحن رصيد حساب WAHO.',
  descriptionZh: '为 WAHO 账户充值。',
  image: '/brand/waho-app-icon.webp',
  category: 'top_up',
  catalogCategoryId: 'waho',
  fulfillmentMode: 'waho_api',
  publisher: 'Al-Wasl Digital',
  isPopular: true,
  isFeatured: true,
  isActive: true,
  requiresUserId: true,
  userIdLabel: 'WAHO ID',
  userIdLabelAr: 'معرف WAHO',
  userIdPlaceholder: 'Enter the WAHO account ID',
  userIdPlaceholderAr: 'أدخل معرف حساب WAHO',
  zoneIdRequired: false,
  countries: ['iq', 'nl'],
  packages: [
    { id: 'pkg-5000', name: '5,000 IQD WAHO Top-Up', nameAr: 'شحن WAHO 5,000 د.ع', amount: 5000, unit: 'IQD top-up', unitAr: 'شحن د.ع', basePrice: 5000, currency: 'IQD', inStock: true },
    { id: 'pkg-10000', name: '10,000 IQD WAHO Top-Up', nameAr: 'شحن WAHO 10,000 د.ع', amount: 10000, unit: 'IQD top-up', unitAr: 'شحن د.ع', basePrice: 10000, currency: 'IQD', inStock: true, isPopular: true },
    { id: 'pkg-25000', name: '25,000 IQD WAHO Top-Up', nameAr: 'شحن WAHO 25,000 د.ع', amount: 25000, unit: 'IQD top-up', unitAr: 'شحن د.ع', basePrice: 25000, currency: 'IQD', inStock: true },
    { id: 'pkg-50000', name: '50,000 IQD WAHO Top-Up', nameAr: 'شحن WAHO 50,000 د.ع', amount: 50000, unit: 'IQD top-up', unitAr: 'شحن د.ع', basePrice: 50000, currency: 'IQD', inStock: true },
    { id: 'pkg-100000', name: '100,000 IQD WAHO Top-Up', nameAr: 'شحن WAHO 100,000 د.ع', amount: 100000, unit: 'IQD top-up', unitAr: 'شحن د.ع', basePrice: 100000, currency: 'IQD', inStock: true },
  ],
};

const asiacellProduct = {
  ...product,
  id: 'waho-asiacell-code',
  slug: 'waho-asiacell-code',
  name: 'Asiacell WAHO Code',
  nameAr: 'رمز آسيا سيل لتطبيق واهو',
  nameZh: 'Asiacell WAHO 充值码',
  description: 'Buy an Asiacell recharge code for WAHO.',
  descriptionAr: 'اشترِ رمز شحن آسيا سيل لاستخدامه في واهو.',
  descriptionZh: '购买用于 WAHO 的 Asiacell 充值码。',
  image: '/brand/asiacell-category.svg',
  catalogCategoryId: 'asiacell',
  fulfillmentMode: 'manual_code',
  requiresUserId: false,
  userIdLabel: 'WhatsApp number',
  userIdLabelAr: 'رقم واتساب',
  userIdPlaceholder: 'Delivered by WhatsApp',
  userIdPlaceholderAr: 'يتم التسليم عبر واتساب',
  packages: [
    { id: 'asia-5000', name: 'Asiacell 5,000 IQD', nameAr: 'آسيا سيل 5,000 د.ع', amount: 28000, unit: '5,000 IQD Asiacell', unitAr: 'آسيا سيل 5,000 د.ع', basePrice: 28000, currency: 'IQD', inStock: true },
    { id: 'asia-10000', name: 'Asiacell 10,000 IQD', nameAr: 'آسيا سيل 10,000 د.ع', amount: 55000, unit: '10,000 IQD Asiacell', unitAr: 'آسيا سيل 10,000 د.ع', basePrice: 55000, currency: 'IQD', inStock: true, isPopular: true },
  ],
};

const catalogCategories = [
  {
    id: 'waho',
    slug: 'waho',
    name: 'WAHO',
    nameAr: 'واهو',
    nameZh: 'WAHO',
    description: 'Direct WAHO balance top-ups.',
    descriptionAr: 'شحن مباشر لرصيد واهو.',
    descriptionZh: 'WAHO 余额直接充值。',
    image: '/brand/waho-app-icon.webp',
    accentColor: '#9bd8f2',
    sortOrder: 0,
    isActive: true,
    productCount: 1,
  },
  {
    id: 'asiacell',
    slug: 'asiacell',
    name: 'Asiacell',
    nameAr: 'آسيا سيل',
    nameZh: 'Asiacell',
    description: 'Asiacell codes delivered through WhatsApp.',
    descriptionAr: 'رموز آسيا سيل يتم تسليمها عبر واتساب.',
    descriptionZh: '通过 WhatsApp 交付 Asiacell 充值码。',
    image: '/brand/asiacell-category.svg',
    accentColor: '#f6b7cc',
    sortOrder: 1,
    isActive: true,
    productCount: 1,
  },
];

const countries = [
  {
    id: 'iq',
    code: 'IQ',
    name: 'Iraq',
    nameAr: 'العراق',
    nameZh: '伊拉克',
    flag: '🇮🇶',
    phoneCode: '+964',
    currency: 'IQD',
    currencySymbol: 'د.ع',
    decimalPlaces: 0,
    exchangeRate: 1,
    primaryPriceCurrency: 'IQD',
    showPricesInIqd: true,
    showPricesInUsd: false,
    showPricesInLocal: true,
    priceCurrencies: [{
      code: 'IQD',
      name: 'Iraqi Dinar',
      symbol: 'د.ع',
      decimalPlaces: 0,
      rate: 1,
      isPrimary: true,
      isAvailable: true,
    }],
    isActive: true,
  },
  {
    id: 'nl',
    code: 'NL',
    name: 'Netherlands',
    nameAr: 'هولندا',
    nameZh: '荷兰',
    flag: '🇳🇱',
    phoneCode: '+31',
    currency: 'EUR',
    currencySymbol: '€',
    decimalPlaces: 2,
    exchangeRate: 0.00065,
    primaryPriceCurrency: 'LOCAL',
    showPricesInIqd: true,
    showPricesInUsd: false,
    showPricesInLocal: true,
    priceCurrencies: [
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        decimalPlaces: 2,
        rate: 0.00065,
        isPrimary: true,
        isAvailable: true,
      },
      {
        code: 'IQD',
        name: 'Iraqi Dinar',
        symbol: 'د.ع',
        decimalPlaces: 0,
        rate: 1,
        isPrimary: false,
        isAvailable: true,
      },
    ],
    isActive: true,
  },
];

const countryCatalog = [
  {
    id: 'iq',
    code: 'IQ',
    numericCode: '368',
    name: 'Iraq',
    nameAr: 'العراق',
    nameZh: '伊拉克',
    flag: '🇮🇶',
    phoneCode: '+964',
    currencyCode: 'IQD',
    currencyName: 'Iraqi Dinar',
    currencySymbol: 'د.ع',
    decimalPlaces: 0,
  },
  {
    id: 'nl',
    code: 'NL',
    numericCode: '528',
    name: 'Netherlands',
    nameAr: 'هولندا',
    nameZh: '荷兰',
    flag: '🇳🇱',
    phoneCode: '+31',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    currencySymbol: '€',
    decimalPlaces: 2,
  },
];

const user = {
  id: 'ux-user',
  phone: '+31612345678',
  name: 'WAHO Customer',
  role: 'user',
  staffPermissions: [],
  accountType: 'customer',
  level: 'bronze',
  walletBalance: 100000,
  totalSpent: 0,
  registeredAt: '2026-01-01T00:00:00.000Z',
  lastLogin: '2026-01-01T00:00:00.000Z',
  isVerified: true,
  discountPercentage: 0,
  isBlocked: false,
};

const adminUser = {
  ...user,
  id: 'ux-admin',
  phone: '+9647812345678',
  name: 'Al-Wasl Admin',
  role: 'admin',
};

const order = {
  id: 'WAHO-2026-000042',
  userId: user.id,
  gameId: product.id,
  packageId: 'pkg-10000',
  gameName: product.name,
  packageName: '10,000 IQD WAHO Top-Up',
  gameUserId: '123456789',
  gameUsername: 'LEO Friend',
  quantity: 1,
  unitPrice: 10000,
  totalPrice: 10000,
  discount: 0,
  finalPrice: 10000,
  currency: 'IQD',
  status: 'processing',
  paymentMethod: 'zaincash',
  paymentStatus: 'completed',
  fulfillmentMode: 'waho_api',
  createdAt: '2026-07-18T10:00:00.000Z',
  updatedAt: '2026-07-18T10:01:00.000Z',
};

const walletTransaction = {
  id: 'wallet-transaction-1',
  userId: user.id,
  type: 'deposit',
  amount: 100000,
  balance: 100000,
  description: 'Wallet deposit approved',
  descriptionAr: 'تم اعتماد إيداع المحفظة',
  reference: 'DEP-2026-0001',
  createdAt: '2026-07-18T09:00:00.000Z',
};

async function mockCustomerApi(page: Page, initiallyAuthenticated = false) {
  let authenticated = initiallyAuthenticated;

  await page.route('**/api/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (payload: unknown, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

    if (path === '/api/countries') return json({ countries });
    if (path === '/api/content') return json({ overrides: [] });
    if (path === '/api/banners') return json({ banners: [] });
    if (path === '/api/categories') return json({ categories: catalogCategories });
    if (path === '/api/categories/waho') {
      return authenticated
        ? json({ category: { ...catalogCategories[0], products: [product] } })
        : json({ error: 'Authentication required' }, 401);
    }
    if (path === '/api/categories/asiacell') {
      return authenticated
        ? json({ category: { ...catalogCategories[1], products: [asiacellProduct] } })
        : json({ error: 'Authentication required' }, 401);
    }
    if (path === '/api/products') {
      const products = [product, asiacellProduct].map((item) => authenticated ? item : { ...item, packages: [] });
      return json({ pricesVisible: authenticated, products });
    }
    if (path === '/api/products/waho-top-up') return authenticated ? json({ product }) : json({ error: 'Authentication required' }, 401);
    if (path === '/api/promotions') return json({ promotions: [] });
    if (path === '/api/payments/methods') return json({
      methods: [
        { id: 'wallet', enabled: true },
        { id: 'qicard', enabled: true, environment: 'sandbox' },
      ],
    });
    if (path === '/api/auth/me') return json({ user: authenticated ? user : null });
    if (path === '/api/orders' && method === 'POST') return json({ order }, 201);
    if (path === '/api/orders') return json({ orders: authenticated ? [order] : [] });
    if (path === '/api/wallet') return json({ user, transactions: [walletTransaction], manualDeposits: [] });
    if (path === '/api/waho/verify' && method === 'POST') {
      return json({ account: { valid: true, wahoId: '123456789', username: 'LEO Friend' } });
    }
    if (path === '/api/auth/login' && method === 'POST') return json({ debugOtp: '123456' });
    if (path === '/api/auth/verify' && method === 'POST') {
      authenticated = true;
      return json({ user });
    }
    if (path === '/api/auth/otp/request' && method === 'POST') return json({ debugOtp: '123456' });
    if (path === '/api/payments/qicard/create' && method === 'POST') {
      return json({
        order: { ...order, paymentMethod: 'qicard', paymentStatus: 'pending', status: 'pending' },
        checkoutUrl: `${url.origin}/payments/qicard/return?orderId=${order.id}`,
        environment: 'sandbox',
        replayed: false,
      });
    }
    if (path === `/api/payments/qicard/${order.id}/status`) {
      return json({
        order: { ...order, paymentMethod: 'qicard', paymentStatus: 'completed', status: 'processing' },
      });
    }
    if (path === `/api/payments/qicard/${order.id}/cancel` && method === 'POST') {
      return json({
        order: { ...order, paymentMethod: 'qicard', paymentStatus: 'failed', status: 'cancelled' },
      });
    }

    return json({ error: `Unhandled test route: ${method} ${path}` }, 404);
  });
}

async function mockAdminApi(page: Page, options: { failSummaryOnce?: boolean } = {}) {
  let summaryFailuresRemaining = options.failSummaryOnce ? 1 : 0;
  let accessBlocks: Array<Record<string, unknown>> = [];
  let contentOverride: Record<string, unknown> | null = null;

  await page.route('**/api/**', async (route: Route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const json = (payload: unknown, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

    if (path === '/api/countries') return json({ countries });
    if (path === '/api/content') return json({ overrides: [] });
    if (path === '/api/auth/me') return json({ user: adminUser });
    if (path === '/api/orders') return json({ orders: [order] });
    if (path === '/api/wallet') return json({ user: adminUser, transactions: [walletTransaction], manualDeposits: [] });
    if (path === '/api/admin/summary') {
      if (summaryFailuresRemaining > 0) {
        summaryFailuresRemaining -= 1;
        return route.abort('failed');
      }

      return json({
        stats: {
          totalUsers: 24,
          activeUsers: 12,
          totalOrders: 42,
          completedOrders: 36,
          failedOrders: 2,
          totalRevenue: 420000,
          todayRevenue: 30000,
          avgOrderValue: 10000,
          conversionRate: 80,
          refundRate: 2,
        },
        users: [adminUser, user],
        categories: catalogCategories,
        products: [product],
        orders: [order],
        walletTransactions: [walletTransaction],
        manualDeposits: [],
        providers: [],
        providerBalanceAlerts: [],
        promotions: [],
        banners: [],
        countries,
        exchangeRates: [],
        customPricingRules: [],
        providerRequests: [],
        whatsappNotifications: [],
        auditLogs: [],
      });
    }
    if (path === '/api/admin/reports') {
      return json({
        report: {
          period: 'daily',
          from: '2026-07-17',
          to: '2026-07-31',
          summary: {
            orders: 42,
            completedOrders: 36,
            failedOrders: 2,
            refundedOrders: 1,
            revenue: 420000,
            walletRevenue: 420000,
            externalPaymentRevenue: 0,
            manualDeposits: 1,
            manualDepositAmount: 100000,
            newUsers: 4,
            avgOrderValue: 10000,
            conversionRate: 80,
            refundRate: 2,
          },
          buckets: [{
            key: '2026-07-18',
            label: '18 Jul',
            start: '2026-07-18T00:00:00.000Z',
            end: '2026-07-19T00:00:00.000Z',
            orders: 1,
            completedOrders: 1,
            failedOrders: 0,
            refundedOrders: 0,
            revenue: 10000,
            walletRevenue: 10000,
            externalPaymentRevenue: 0,
            manualDeposits: 0,
            manualDepositAmount: 0,
            newUsers: 1,
          }],
        },
      });
    }
    if (path === '/api/admin/monitoring') {
      return json({
        monitoring: {
          settings: {
            id: 'monitoring-settings',
            logRetentionDays: 30,
            uptimeEnabled: true,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-18T00:00:00.000Z',
          },
          targets: [],
          events: [],
          summary: {
            activeTargets: 0,
            downTargets: 0,
            errorEvents24h: 0,
            criticalEvents24h: 0,
          },
          external: {
            healthEndpoint: 'https://example.test/api/health',
            errorWebhookConfigured: true,
            statusWebhookConfigured: true,
          },
        },
      });
    }
    if (path === '/api/admin/countries/catalog') return json({ countries: countryCatalog });
    if (path === '/api/admin/access-blocks' && method === 'GET') return json({ blocks: accessBlocks });
    if (path === '/api/admin/access-blocks' && method === 'POST') {
      const body = route.request().postDataJSON() as {
        type: string;
        value: string;
        reason: string;
        notifyByWhatsApp: boolean;
      };
      const block = {
        id: 'block-1',
        type: body.type,
        maskedValue: '*******5678',
        reason: body.reason,
        isActive: true,
        expiresAt: null,
        revokedAt: null,
        notificationRequested: body.notifyByWhatsApp,
        notificationStatus: body.notifyByWhatsApp ? 'SENT' : null,
        notificationError: null,
        createdAt: '2026-07-31T10:00:00.000Z',
        user,
        createdByAdmin: { id: adminUser.id, name: adminUser.name },
      };
      accessBlocks = [block];
      return json({ block }, 201);
    }
    if (/^\/api\/admin\/access-blocks\/[^/]+$/.test(path) && method === 'PATCH') {
      const body = route.request().postDataJSON() as { isActive: boolean };
      accessBlocks = accessBlocks.map((block) => ({ ...block, isActive: body.isActive }));
      return json({ block: accessBlocks[0] });
    }
    if (/^\/api\/admin\/access-blocks\/[^/]+\/notify$/.test(path) && method === 'POST') {
      accessBlocks = accessBlocks.map((block) => ({ ...block, notificationStatus: 'SENT' }));
      return json({ block: accessBlocks[0] });
    }
    if (path === '/api/admin/content' && method === 'GET') {
      return json({
        entries: [{
          key: 'Choose amount',
          module: 'home',
          valueEn: 'Choose amount',
          valueAr: 'اختر المبلغ',
          valueZh: '选择金额',
          override: contentOverride,
        }],
      });
    }
    if (path === '/api/admin/content' && method === 'PUT') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      contentOverride = { id: 'content-1', ...body };
      return json({ override: contentOverride });
    }
    if (path === '/api/admin/content' && method === 'DELETE') {
      contentOverride = null;
      return json({ deleted: true });
    }
    if (/^\/api\/admin\/countries\/[^/]+$/.test(path) && method === 'PATCH') {
      return json({ country: countries.find((country) => path.endsWith(country.id)) });
    }

    return json({ error: `Unhandled admin test route: ${method} ${path}` }, 404);
  });
}

async function captureVisual(page: Page, projectName: string, name: string) {
  const outputDirectory = process.env.UX_SCREENSHOT_DIR;
  if (!outputDirectory) return;

  await page.waitForFunction(
    () => Array.from(document.querySelectorAll<HTMLImageElement>('[data-visual-required-image]'))
      .every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 5000 }
  );
  await page.locator('[data-visual-required-image]').evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (
      image instanceof HTMLImageElement ? image.decode().catch(() => undefined) : Promise.resolve()
    )));
  });
  await mkdir(outputDirectory, { recursive: true });
  await page.screenshot({
    path: join(outputDirectory, `${projectName}-${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
          text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          overflowX: getComputedStyle(element).overflowX,
        };
      })
      .filter((element) => (
        element.left < -1 ||
        element.right > window.innerWidth + 1 ||
        (element.scrollWidth > element.clientWidth + 1 && element.overflowX === 'visible')
      ))
      .slice(0, 8),
  }));
  const message = `Horizontal overflow: ${JSON.stringify(overflow.offenders)}`;
  expect(overflow.document, message).toBeLessThanOrEqual(overflow.viewport + 1);
  expect(overflow.body, message).toBeLessThanOrEqual(overflow.viewport + 1);
}

async function expectAllInsideViewport(page: Page, selector: string) {
  const bounds = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width };
  }));

  for (const bound of bounds) {
    expect(bound.width).toBeGreaterThan(0);
    expect(bound.left).toBeGreaterThanOrEqual(-1);
    expect(bound.right).toBeLessThanOrEqual(391);
  }
}

test.describe('generation 2 customer experience', () => {
  test('makes the protected multi-category journey obvious on a small phone', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Recharge your digital balance' })).toBeVisible();
    await expect(page.getByTestId('home-primary-topup')).toHaveAccessibleName('Login to see prices');
    await expect(page.getByText('Prices open after login')).toBeVisible();
    const categoryCards = page.getByTestId('catalog-category-card');
    await expect(categoryCards).toHaveCount(2);
    await expect(categoryCards.filter({ hasText: 'WAHO' })).toHaveAttribute('href', /\/auth\?next=.*categories.*waho/);
    await expect(categoryCards.filter({ hasText: 'Asiacell' })).toHaveAttribute('href', /\/auth\?next=.*categories.*asiacell/);

    const mobileTabs = page.locator('[data-mobile-tab-bar]');
    await expect(mobileTabs).toBeVisible();
    await expect(mobileTabs.getByRole('link')).toHaveCount(5);
    await expect(mobileTabs.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');

    const heroMetrics = await page.locator('[data-v2-hero-metrics] > div').evaluateAll((items) => items.map((item) => {
      const rect = item.getBoundingClientRect();
      return { y: Math.round(rect.y), width: Math.round(rect.width) };
    }));
    expect(heroMetrics).toHaveLength(4);
    expect(new Set(heroMetrics.map((item) => item.y)).size).toBe(1);
    expect(heroMetrics.every((item) => item.width >= 88)).toBe(true);

    const processItems = await page.locator('[data-v2-process-steps] > li').evaluateAll((items) => items.map((item) => {
      const rect = item.getBoundingClientRect();
      return { y: Math.round(rect.y), width: Math.round(rect.width) };
    }));
    expect(processItems).toHaveLength(3);
    expect(new Set(processItems.map((item) => item.y)).size).toBe(1);
    expect(processItems.every((item) => item.width >= 110)).toBe(true);

    const categoryCardMetrics = await categoryCards.evaluateAll((items) => items.map((item) => {
      const rect = item.getBoundingClientRect();
      return { y: Math.round(rect.y), width: Math.round(rect.width) };
    }));
    expect(categoryCardMetrics).toHaveLength(2);
    expect(categoryCardMetrics.every((item) => item.width >= 300)).toBe(true);
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'home-mobile');
  });

  test('keeps the smallest phone compact, tappable and clear to the final footer link', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await mockCustomerApi(page, true);
    await page.goto('/');

    const primaryAction = page.getByTestId('home-primary-topup');
    const primaryActionBox = await primaryAction.boundingBox();
    expect(primaryActionBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const mobileNavigation = page.locator('[data-mobile-tab-bar]');
    await expect(mobileNavigation.getByRole('link')).toHaveCount(5);
    await expect(mobileNavigation.getByRole('link', { name: 'Account' })).toBeVisible();
    const mobileTabBoxes = await page.locator('[data-mobile-tab-bar] a:visible').evaluateAll((links) => (
      links.map((link) => {
        const rect = link.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
    ));
    for (const box of mobileTabBoxes) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    await page.goto('/top-up/waho-top-up?amount=10000');
    const amountCards = page.locator('button[aria-pressed]');
    await expect(amountCards).toHaveCount(5);
    const firstCard = await amountCards.nth(0).boundingBox();
    const secondCard = await amountCards.nth(1).boundingBox();
    const thirdCard = await amountCards.nth(2).boundingBox();
    expect(firstCard?.width ?? 0).toBeGreaterThanOrEqual(80);
    expect(secondCard?.width ?? 0).toBeGreaterThanOrEqual(80);
    expect(thirdCard?.width ?? 0).toBeGreaterThanOrEqual(80);
    expect(Math.abs((firstCard?.y ?? 0) - (secondCard?.y ?? 100))).toBeLessThan(3);
    expect(Math.abs((firstCard?.y ?? 0) - (thirdCard?.y ?? 100))).toBeLessThan(3);
    const selectedCheck = page.locator('[data-selected-package-check]');
    await expect(selectedCheck).toHaveCount(1);
    const selectedCheckBox = await selectedCheck.boundingBox();
    expect(selectedCheckBox?.x ?? 1000).toBeGreaterThanOrEqual(secondCard?.x ?? 0);
    expect((selectedCheckBox?.x ?? 1000) + (selectedCheckBox?.width ?? 0))
      .toBeLessThanOrEqual((secondCard?.x ?? 0) + (secondCard?.width ?? 0));

    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitem', { name: 'العربية' }).click();
    const checkoutStepLabels = page.locator('[data-checkout-step-label]');
    await expect(checkoutStepLabels).toHaveCount(4);
    const clippedStepLabels = await checkoutStepLabels.evaluateAll((labels) => labels
      .filter((label) => (
        label.scrollWidth > label.clientWidth + 1 ||
        label.scrollHeight > label.clientHeight + 1
      ))
      .map((label) => label.textContent?.trim()));
    expect(clippedStepLabels).toEqual([]);

    await page.goto('/');
    await page.locator('footer').scrollIntoViewIfNeeded();
    const footerAndNavigation = await page.evaluate(() => {
      const footer = document.querySelector('footer')?.getBoundingClientRect();
      const navigation = document.querySelector('[data-mobile-tab-bar]')?.getBoundingClientRect();
      return {
        footerBottom: footer?.bottom ?? 1000,
        navigationTop: navigation?.top ?? 0,
      };
    });
    expect(footerAndNavigation.footerBottom).toBeLessThanOrEqual(footerAndNavigation.navigationTop + 1);
    await expectNoHorizontalOverflow(page);
  });

  test('keeps the selected amount and brings the active WAHO ID form into view', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page, true);
    await page.goto('/top-up/waho-top-up?amount=10000');

    await expect(page.getByRole('navigation', { name: 'Top-up progress' })).toContainText('Amount');
    await expect(page.getByRole('navigation', { name: 'Top-up progress' })).toContainText('WAHO ID');
    const selectedAmount = page.locator('button[aria-pressed="true"]').filter({ hasText: '10,000' });
    await expect(selectedAmount).toHaveCount(1);
    await expect(selectedAmount).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: /^Continue with 10,000/ }).click();
    const detailsHeading = page.getByRole('heading', { name: 'WAHO ID', exact: true });
    await expect(detailsHeading).toBeVisible();
    await expect(detailsHeading).toBeFocused();
    const box = await detailsHeading.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.y ?? 1000).toBeLessThan(360);

    await page.getByRole('textbox', { name: 'WAHO ID', exact: true }).fill('123456789');
    await page.getByRole('button', { name: 'Check ID' }).click();
    await expect(page.getByText('Account found', { exact: true })).toBeVisible();
    await expect(page.getByRole('status').getByText('LEO Friend')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'wizard-step-two-mobile');
  });

  test('returns to the selected top-up after WhatsApp login', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page);
    await page.goto('/auth?next=%2Ftop-up%2Fwaho-top-up%3Famount%3D25000');

    await page.getByRole('combobox', { name: 'Country calling code' }).click();
    await page.getByPlaceholder('Search country or code').fill('Netherlands');
    await page.getByRole('option', { name: /Netherlands.*\+31/ }).click();
    await page.getByLabel('Phone number').fill('612345678');
    await captureVisual(page, testInfo.project.name, 'login-netherlands-mobile');
    await page.getByRole('button', { name: 'Send WhatsApp code' }).click();

    await page.getByLabel('6-digit verification code').fill('123456');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/top-up\/waho-top-up\?amount=25000/);
  });

  test('completes the full top-up journey with a protected confirmation', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page, true);
    await page.goto('/top-up/waho-top-up?amount=10000');

    await page.getByRole('button', { name: /^Continue with 10,000/ }).click();
    await page.getByRole('textbox', { name: 'WAHO ID', exact: true }).fill('123456789');
    await page.getByRole('button', { name: 'Check ID' }).click();
    await expect(page.getByText('Account found', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue to payment' }).click();

    await expect(page.getByRole('heading', { name: 'Choose how to pay' })).toBeFocused();
    await expect(page.getByText('Available: 100,000 د.ع')).toBeVisible();
    await page.getByRole('button', { name: 'Review order' }).click();

    await expect(page.getByRole('heading', { name: 'Check everything once more' })).toBeFocused();
    await expect(page.getByText('LEO Friend').first()).toBeVisible();
    await expect(page.getByText('10,000 IQD').first()).toBeVisible();
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByLabel('6-digit verification code')).toHaveValue('123456');
    await expect(page.getByRole('button', { name: 'Confirm and place order' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Confirm and place order' })).toBeInViewport();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'wizard-confirm-mobile');

    await page.getByRole('button', { name: 'Confirm and place order' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByText('WAHO-2026-000042')).toBeVisible();
  });

  test('completes the QiCard handoff and confirms payment from the status API', async ({ page }, testInfo) => {
    await page.setViewportSize(testInfo.project.name === 'mobile-chromium'
      ? { width: 390, height: 844 }
      : { width: 1280, height: 900 });
    await mockCustomerApi(page, true);
    await page.goto('/top-up/waho-top-up?amount=10000');

    await page.getByRole('button', { name: /^Continue with 10,000/ }).click();
    await page.getByRole('textbox', { name: 'WAHO ID', exact: true }).fill('123456789');
    await page.getByRole('button', { name: 'Check ID' }).click();
    await page.getByRole('button', { name: 'Continue to payment' }).click();

    const qiCard = page.getByRole('radio', { name: /QiCard/ });
    await expect(qiCard).toBeVisible();
    await qiCard.click();
    await expect(page.getByText('Secure card checkout in test mode')).toBeVisible();
    await page.getByRole('button', { name: 'Review order' }).click();
    await expect(page.getByText('QiCard', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByLabel('6-digit verification code')).toHaveValue('123456');
    await page.getByRole('button', { name: 'Continue to secure payment' }).click();

    await expect(page).toHaveURL(new RegExp(`/payments/qicard/return\\?orderId=${order.id}$`));
    await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View my orders' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'qicard-return');
  });

  test('keeps Chinese, Arabic RTL and dark mode complete', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page, true);
    await page.goto('/');

    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitem', { name: '中文' }).click();
    await expect(page.getByRole('heading', { level: 1, name: '充值数字余额' })).toBeVisible();
    await captureVisual(page, testInfo.project.name, 'home-chinese-dark-mobile');

    await page.getByRole('button', { name: '切换语言' }).click();
    await page.getByRole('menuitem', { name: 'العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1, name: 'اشحن رصيدك الرقمي' })).toBeVisible();

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: 'التبديل إلى الوضع الفاتح' })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'home-arabic-dark-mobile');

    await page.goto('/top-up/waho-top-up?amount=10000');
    await expect(page.getByRole('heading', { name: 'اختر المبلغ' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'تقدم عملية الشحن' }).getByRole('listitem')).toHaveCount(4);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'wizard-arabic-dark-mobile');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'اشحن رصيدك الرقمي' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'home-arabic-dark-desktop');
  });

  test('uses wide screens for overview without stretching the main task', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCustomerApi(page, true);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Recharge your digital balance' })).toBeVisible();
    await expect(page.getByTestId('catalog-category-card')).toHaveCount(2);
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'home-desktop');

    await page.goto('/top-up/waho-top-up?amount=10000');
    await expect(page.locator('button[aria-pressed="true"]').filter({ hasText: '10,000' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'wizard-desktop');
  });

  test('keeps busy account screens clear on a phone', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page, true);

    await page.goto('/orders');
    await expect(page.getByRole('heading', { level: 1, name: 'My orders' })).toBeVisible();
    await expect(page.getByText('WAHO-2026-000042')).toBeVisible();
    await expectAllInsideViewport(page, '[role="tab"]');
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'orders-mobile');

    await page.goto('/wallet');
    await expect(page.getByRole('heading', { level: 1, name: 'My wallet' })).toBeVisible();
    await page.getByRole('button', { name: 'Add wallet balance' }).click();
    await expect(page.getByRole('dialog', { name: 'Add wallet balance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send deposit for review' })).toBeInViewport();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'wallet-dialog-mobile');
    await page.keyboard.press('Escape');

    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Account overview' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'profile-mobile');
  });

  test('keeps every customer page understandable and complete on mobile', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    test.skip(testInfo.project.name !== 'chromium', 'The customer route matrix only needs one browser project.');
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page, true);

    const routes = [
      { path: '/', name: 'home' },
      { path: '/top-up', name: 'amounts' },
      { path: '/top-up/waho-top-up?amount=10000', name: 'wizard' },
      { path: '/promotions', name: 'offers' },
      { path: '/help', name: 'help' },
      { path: '/faq', name: 'faq' },
      { path: '/contact', name: 'contact' },
      { path: '/about', name: 'about' },
      { path: '/settings', name: 'settings' },
      { path: '/terms', name: 'terms' },
      { path: '/privacy', name: 'privacy' },
      { path: '/cart', name: 'cart' },
      { path: '/auth', name: 'login' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/\b(?:mock|demo|API|provider|storefront)\b/i);
      await expectNoHorizontalOverflow(page);
      await captureVisual(page, testInfo.project.name, `route-${route.name}-mobile`);
    }
  });

  test('has no horizontal overflow at all required acceptance widths', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'The responsive width matrix only needs one browser project.');
    await mockCustomerApi(page, true);

    for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      if (width === 320) {
        await captureVisual(page, testInfo.project.name, 'home-320');
      }

      await page.goto('/top-up/waho-top-up?amount=10000');
      await expect(page.getByRole('heading', { name: 'Choose your amount' })).toBeVisible();
      await expectNoHorizontalOverflow(page);

      if (width === 320) {
        const selectedCard = page.locator('button[aria-pressed="true"]').filter({ hasText: '10,000' });
        const selectedCardBox = await selectedCard.boundingBox();
        expect(selectedCardBox?.width ?? 0).toBeGreaterThan(80);
        await captureVisual(page, testInfo.project.name, 'wizard-320');
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps all admin sections reachable on a phone without fake alerts', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'The admin mobile shell only needs one browser project.');
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAdminApi(page);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { level: 1, name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open admin navigation' })).toBeVisible();
    await page.getByRole('button', { name: 'Open admin navigation' }).click();
    const adminNavigation = page.getByRole('navigation', { name: 'Admin sections' });
    await expect(adminNavigation).toBeVisible();
    await adminNavigation.getByRole('button', { name: 'Orders' }).click();
    await expect(adminNavigation).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Admin alerts: 2' })).toHaveText('2');
    await expect(page.locator('[data-admin-mobile-order]')).toHaveCount(1);
    await expect(page.locator('[data-admin-mobile-order]')).toBeVisible();
    await expect(page.locator('[data-admin-desktop-orders]')).toBeHidden();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-orders-mobile');
  });

  test('keeps every admin workspace readable and reachable on a phone', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    test.skip(testInfo.project.name !== 'chromium', 'The admin route matrix only needs one browser project.');
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAdminApi(page);
    await page.goto('/admin');
    await expect(page.getByText('Total Revenue')).toBeVisible();

    const sections = [
      ['Categories', 'Catalog categories'],
      ['Top-up amounts', 'Products and top-up amounts'],
      ['Custom pricing', 'Custom pricing'],
      ['Users', 'Users'],
      ['Access blocks', 'Access blocks'],
      ['Providers', 'Delivery Partners'],
      ['Promotions', 'Promotions'],
      ['Banners', 'Banners'],
      ['Website text', 'Website text'],
      ['Currencies', 'Currency & exchange rates'],
      ['Wallets', 'Wallets'],
      ['Reports', 'Reports'],
      ['Monitoring', 'Monitoring'],
    ] as const;

    for (const [navigationLabel, heading] of sections) {
      await page.getByRole('button', { name: 'Open admin navigation' }).click();
      const navigation = page.getByRole('navigation', { name: 'Admin sections' });
      await navigation.getByRole('button', { name: navigationLabel, exact: true }).click();
      await expect(page.getByRole('heading', { level: 2, name: heading, exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await expect(page.locator('body')).not.toContainText(/\b(?:mock|demo)\b/i);
    await captureVisual(page, testInfo.project.name, 'admin-monitoring-mobile');
  });

  test('keeps the new admin controls balanced on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'The desktop admin visual pass only needs one browser project.');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await mockAdminApi(page);
    await page.goto('/admin');
    await expect(page.getByText('Total Revenue')).toBeVisible();

    await page.getByRole('button', { name: 'Access blocks', exact: true }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Access blocks' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-access-blocks-desktop');

    await page.getByRole('button', { name: 'Currencies', exact: true }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Price display by country' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-country-pricing-desktop');

    await page.getByRole('button', { name: 'Website text', exact: true }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Website text' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-content-desktop');
  });

  test('lets an admin block access, send the reason, and edit website text on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'The admin mutation flow only needs one browser project.');
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAdminApi(page);
    await page.goto('/admin');
    await expect(page.getByText('Total Revenue')).toBeVisible();

    await page.getByRole('button', { name: 'Open admin navigation' }).click();
    await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('button', { name: 'Access blocks' }).click();
    await page.getByRole('button', { name: 'Add block' }).click();
    const blockDialog = page.getByRole('dialog', { name: 'Block access' });
    await blockDialog.getByLabel('WhatsApp number').fill('+31612345678');
    await blockDialog.getByLabel('Reason shown to the customer').fill('Repeated invalid account details');
    await expect(blockDialog.getByText('Send reason on WhatsApp')).toBeVisible();
    await blockDialog.getByRole('button', { name: 'Block access' }).click();
    await expect(page.getByText('Repeated invalid account details')).toBeVisible();
    await expect(page.getByText('WhatsApp reason sent')).toBeVisible();
    await page.getByPlaceholder('Search blocks or reasons').fill('invalid');
    await expect(page.getByText('Repeated invalid account details')).toBeVisible();
    await page.getByLabel('Filter by block type').selectOption('WHATSAPP');
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-access-blocks-mobile');

    await page.getByRole('button', { name: 'Open admin navigation' }).click();
    await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('button', { name: 'Website text' }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    const contentDialog = page.getByRole('dialog', { name: 'Edit website text' });
    await contentDialog.getByLabel('English').fill('Select your balance');
    await contentDialog.getByRole('button', { name: 'Save text' }).click();
    await expect(page.getByText('Select your balance')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-content-mobile');
  });

  test('keeps country price controls usable beside the world map', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'The admin map flow only needs one browser project.');
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAdminApi(page);
    await page.goto('/admin');
    await expect(page.getByText('Total Revenue')).toBeVisible();

    await page.getByRole('button', { name: 'Open admin navigation' }).click();
    await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('button', { name: 'Currencies' }).click();
    await expect(page.getByRole('heading', { name: 'Price display by country' })).toBeVisible();
    const countryPricing = page.getByRole('region', { name: 'Price display by country' });
    await expect(countryPricing.getByText('Local currency', { exact: true })).toHaveCount(0);
    await page.getByPlaceholder('Search country or currency').fill('Netherlands');
    await page.getByRole('button', { name: 'Netherlands', exact: true }).click();
    await expect(countryPricing.getByText('Local currency', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Primary price')).toHaveValue('LOCAL');
    await expect(page.getByText('Example for 10,000 IQD')).toBeVisible();
    await expect(page.getByText('Currently available: EUR, IQD')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-country-pricing-mobile');
  });

  test('lets an admin recover from a failed dashboard load without reloading the page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'The admin recovery flow only needs one browser project.');
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAdminApi(page, { failSummaryOnce: true });
    await page.goto('/admin');

    await expect(page.locator('[data-admin-error]')).toContainText('dashboard');
    const retry = page.getByRole('button', { name: 'Try loading admin data again' });
    await expect(retry).toBeVisible();
    await retry.click();

    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.locator('[data-admin-error]')).toHaveCount(0);
  });

  test('places the desktop admin navigation on the reading side in Arabic', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'The RTL desktop shell only needs one browser project.');
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('alwasl-language', 'ar');
      localStorage.setItem('language', 'ar');
    });
    await mockAdminApi(page);
    await page.goto('/admin');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const sidebar = page.locator('[data-admin-sidebar]');
    await expect(sidebar).toBeVisible();
    const bounds = await sidebar.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.abs(1024 - ((bounds?.x ?? 0) + (bounds?.width ?? 0)))).toBeLessThanOrEqual(1);
    await expectNoHorizontalOverflow(page);
  });
});
