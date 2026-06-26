import { expect, test, type APIRequestContext } from '@playwright/test';

interface TopUpPackage {
  id: string;
  amount: number;
  inStock: boolean;
}

interface ProductPayload {
  products: Array<{
    slug: string;
    name: string;
    packages: TopUpPackage[];
  }>;
}

function uniquePhone(projectName: string, workerIndex: number) {
  const digits = `${Date.now()}${workerIndex}${projectName.length}`.replace(/\D/g, '').slice(-9);
  return `+96478${digits.padStart(9, '0')}`;
}

async function loadWahoProduct(request: APIRequestContext) {
  const response = await request.get('/api/products');
  expect(response.status()).toBe(200);

  const payload = (await response.json()) as ProductPayload;
  expect(payload.products).toHaveLength(1);

  const product = payload.products[0];
  expect(product.slug).toBe('waho-top-up');
  expect(product.packages.length).toBeGreaterThan(0);

  const firstPackage = product.packages.find((item) => item.inStock);
  expect(firstPackage).toBeTruthy();

  return { product, firstPackage: firstPackage as TopUpPackage };
}

async function loginWithOtp(request: APIRequestContext, phone: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const login = await request.post('/api/auth/login', {
      data: { phone },
    });
    expect(login.status()).toBe(200);

    const loginPayload = (await login.json()) as { debugOtp?: string };
    expect(loginPayload.debugOtp).toMatch(/^\d{6}$/);

    const verify = await request.post('/api/auth/verify', {
      data: { phone, otp: loginPayload.debugOtp },
    });

    if (verify.status() !== 200 && attempt < 2) continue;
    expect(verify.status()).toBe(200);

    const setCookie = verify.headers()['set-cookie'];
    const sessionCookie = setCookie?.match(/alwasl_session=([^;]+)/)?.[1];
    expect(sessionCookie).toBeTruthy();

    return {
      user: ((await verify.json()) as { user: { id: string; phone: string; role: string } }).user,
      headers: { Cookie: `alwasl_session=${sessionCookie}` },
    };
  }

  throw new Error('OTP login failed');
}

test.describe('WAHO production smoke', () => {
  test('renders the WAHO top-up journey from seeded product data', async ({ page, request }) => {
    const { product, firstPackage } = await loadWahoProduct(request);
    const unsupportedProducts = await request.get('/api/products?country=zz');
    expect(unsupportedProducts.status()).toBe(200);
    const unsupportedProductsPayload = (await unsupportedProducts.json()) as ProductPayload;
    expect(unsupportedProductsPayload.products.map((item) => item.slug)).toContain(product.slug);

    const unsupportedProduct = await request.get(`/api/products/${product.slug}?country=zz`);
    expect(unsupportedProduct.status()).toBe(200);
    expect((await unsupportedProduct.json()) as { product: { slug: string } }).toMatchObject({
      product: { slug: product.slug },
    });

    await page.goto('/');
    await expect(page.getByRole('link', { name: /WAHO Top-Up/i }).first()).toBeVisible();

    await page.goto('/top-up');
    await expect(page.locator('main')).toContainText('WAHO Top-Up', { timeout: 15_000 });
    const startTopUpLink = page.getByRole('link', { name: /Start top-up/i }).first();
    await expect(startTopUpLink).toBeVisible({ timeout: 15_000 });
    await startTopUpLink.click();
    await expect(page).toHaveURL(new RegExp(`/top-up/${product.slug}`));
    await expect(page.getByRole('heading', { name: /Select top-up amount/i })).toBeVisible();

    await page.goto(`/top-up/${product.slug}`);
    await expect(page.getByRole('heading', { name: /WAHO Account Top-Up/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Select top-up amount/i })).toBeVisible();

    const amount = new Intl.NumberFormat('en-IQ').format(firstPackage.amount);
    const amountButton = page.getByRole('button', { name: new RegExp(amount) }).first();
    await expect(amountButton).toBeVisible();
    await amountButton.click();

    await expect(page.getByRole('button', { name: /Continue/i })).toBeEnabled();
  });

  test('uses real auth/session APIs and keeps production-only mutations locked down', async ({ request }, testInfo) => {
    const unauthenticatedOrders = await request.get('/api/orders');
    expect(unauthenticatedOrders.status()).toBe(401);

    const phone = uniquePhone(testInfo.project.name, testInfo.workerIndex);
    const { user, headers: authenticatedHeaders } = await loginWithOtp(request, phone);
    expect(user).toMatchObject({ phone, role: 'user' });

    const me = await request.get('/api/auth/me', { headers: authenticatedHeaders });
    expect(me.status()).toBe(200);
    const mePayload = (await me.json()) as { user: { phone: string; role: string } };
    expect(mePayload.user).toMatchObject({ phone, role: 'user' });

    const adminSummary = await request.get('/api/admin/summary', { headers: authenticatedHeaders });
    expect(adminSummary.status()).toBe(403);

    const fakePayment = await request.post('/api/payments/fake/confirm', {
      headers: authenticatedHeaders,
      data: { orderId: 'ORD-E2E-BLOCKED', success: true },
    });
    expect(fakePayment.status()).toBe(404);

    const walletTopUp = await request.post('/api/wallet/top-up', {
      headers: authenticatedHeaders,
      data: { amount: 5000, paymentMethod: 'zaincash' },
    });
    expect(walletTopUp.status()).toBe(428);
    expect(await walletTopUp.json()).toEqual({ error: 'OTP verification is required for this action' });

    const { product, firstPackage } = await loadWahoProduct(request);
    const orderWithoutIdempotencyKey = await request.post('/api/orders', {
      headers: authenticatedHeaders,
      data: {
        productSlug: product.slug,
        packageId: firstPackage.id,
        wahoId: '123456789',
        paymentMethod: 'wallet',
      },
    });
    expect(orderWithoutIdempotencyKey.status()).toBe(400);
    expect(await orderWithoutIdempotencyKey.json()).toEqual({ error: 'Idempotency-Key header is required' });

    const orderWithoutSensitiveOtp = await request.post('/api/orders', {
      headers: {
        ...authenticatedHeaders,
        'Idempotency-Key': `e2e-order-no-otp-${testInfo.project.name}-${testInfo.workerIndex}`,
      },
      data: {
        productSlug: product.slug,
        packageId: firstPackage.id,
        wahoId: '123456789',
        paymentMethod: 'wallet',
      },
    });
    expect(orderWithoutSensitiveOtp.status()).toBe(428);
    expect(await orderWithoutSensitiveOtp.json()).toEqual({ error: 'OTP verification is required for this action' });

    const orderOtp = await request.post('/api/auth/otp/request', {
      headers: authenticatedHeaders,
      data: { purpose: 'ORDER_CONFIRMATION' },
    });
    expect(orderOtp.status()).toBe(200);
    const orderOtpPayload = (await orderOtp.json()) as { debugOtp?: string };
    expect(orderOtpPayload.debugOtp).toMatch(/^\d{6}$/);

    const order = await request.post('/api/orders', {
      headers: {
        ...authenticatedHeaders,
        'Idempotency-Key': `e2e-order-${testInfo.project.name}-${testInfo.workerIndex}`,
      },
      data: {
        productSlug: product.slug,
        packageId: firstPackage.id,
        wahoId: '123456789',
        paymentMethod: 'wallet',
        otp: orderOtpPayload.debugOtp,
      },
    });
    expect(order.status()).toBe(424);
    expect(await order.json()).toEqual({ error: 'WAHO verification is temporarily unavailable' });
  });

  test('writes admin audit logs when the admin summary is viewed', async ({ request }) => {
    const adminPhone = '+9647812345678';
    const { user, headers: authenticatedHeaders } = await loginWithOtp(request, adminPhone);
    expect(user).toMatchObject({ phone: adminPhone, role: 'admin' });

    const summary = await request.get('/api/admin/summary', {
      headers: {
        ...authenticatedHeaders,
        'x-forwarded-for': '198.51.100.44, 10.0.0.1',
        'user-agent': 'alwasl-e2e-admin-audit',
      },
    });
    expect(summary.status()).toBe(200);

    const payload = (await summary.json()) as {
      auditLogs?: Array<{
        action: string;
        entityType: string;
        adminPhone?: string;
      }>;
    };
    expect(payload.auditLogs?.some((log) => (
      log.action === 'admin.summary.view' &&
      log.entityType === 'admin_dashboard' &&
      log.adminPhone === adminPhone
    ))).toBe(true);
    expect(payload.auditLogs?.find((log) => log.action === 'admin.summary.view')).toMatchObject({
      action: 'admin.summary.view',
      entityType: 'admin_dashboard',
      adminPhone,
    });

    const report = await request.get('/api/admin/reports?period=monthly', { headers: authenticatedHeaders });
    expect(report.status()).toBe(200);
    const reportPayload = (await report.json()) as {
      report: {
        period: string;
        summary: { revenue: number; orders: number };
        buckets: Array<{ key: string; revenue: number; orders: number }>;
      };
    };
    expect(reportPayload.report.period).toBe('monthly');
    expect(Array.isArray(reportPayload.report.buckets)).toBe(true);
    expect(reportPayload.report.summary).toMatchObject({
      revenue: expect.any(Number),
      orders: expect.any(Number),
    });

    const reportExport = await request.get('/api/admin/reports/export?period=monthly', { headers: authenticatedHeaders });
    expect(reportExport.status()).toBe(200);
    expect(reportExport.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(reportExport.headers()['content-disposition']).toContain('alwasl-report-monthly');
  });

  test('runs admin CRUD mutations against database-backed routes', async ({ request, baseURL }, testInfo) => {
    const adminPhone = '+9647812345678';
    const { user, headers: authenticatedHeaders } = await loginWithOtp(request, adminPhone);
    expect(user).toMatchObject({ phone: adminPhone, role: 'admin' });

    const uniqueSuffix = `${Date.now().toString(36).toUpperCase()}${testInfo.workerIndex}${testInfo.project.name.length}`;
    const uniqueAmount = 800_000_000 + Number(`${Date.now()}`.slice(-7)) + testInfo.workerIndex;

    const topup = await request.post('/api/admin/topup-packages', {
      headers: authenticatedHeaders,
      data: {
        productId: 'waho-top-up',
        amount: uniqueAmount,
        basePrice: uniqueAmount,
        inStock: true,
        isPopular: false,
      },
    });
    expect(topup.status()).toBe(201);
    const topupPayload = (await topup.json()) as { package: { id: string; amount: number } };
    expect(topupPayload.package).toMatchObject({ amount: uniqueAmount });

    const topupPatch = await request.patch(`/api/admin/topup-packages/${topupPayload.package.id}`, {
      headers: authenticatedHeaders,
      data: { inStock: false },
    });
    expect(topupPatch.status()).toBe(200);

    const pricingRule = await request.post('/api/admin/pricing-rules', {
      headers: authenticatedHeaders,
      data: {
        name: `E2E distributor price ${uniqueSuffix}`,
        targetType: 'DISTRIBUTOR',
        priceType: 'FIXED_PRICE',
        value: uniqueAmount - 1000,
        productId: 'waho-top-up',
        packageId: topupPayload.package.id,
        priority: 10,
        isActive: true,
        applyMembershipDiscount: false,
      },
    });
    expect(pricingRule.status()).toBe(201);
    const pricingRulePayload = (await pricingRule.json()) as { customPricingRule: { id: string; targetType: string; value: number } };
    expect(pricingRulePayload.customPricingRule).toMatchObject({
      targetType: 'distributor',
      value: uniqueAmount - 1000,
    });

    const pricingRulePatch = await request.patch(`/api/admin/pricing-rules/${pricingRulePayload.customPricingRule.id}`, {
      headers: authenticatedHeaders,
      data: { isActive: false },
    });
    expect(pricingRulePatch.status()).toBe(200);

    const provider = await request.post('/api/admin/providers', {
      headers: authenticatedHeaders,
      data: {
        name: `E2E Provider ${uniqueSuffix}`,
        type: 'WAHA_WHATSAPP',
        priority: 50,
        balance: 100000,
        lowBalanceThreshold: 1000,
        isActive: false,
        supportedProducts: ['waho-top-up'],
      },
    });
    expect(provider.status()).toBe(201);
    const providerPayload = (await provider.json()) as { provider: { id: string; name: string } };
    expect(providerPayload.provider.name).toContain('E2E Provider');

    const providerPatch = await request.patch(`/api/admin/providers/${providerPayload.provider.id}`, {
      headers: authenticatedHeaders,
      data: { priority: 51 },
    });
    expect(providerPatch.status()).toBe(200);

    const promotionCode = `E2E${uniqueSuffix}`.slice(0, 28);
    const promotion = await request.post('/api/admin/promotions', {
      headers: authenticatedHeaders,
      data: {
        code: promotionCode,
        type: 'percentage',
        value: 5,
        minPurchase: 5000,
        maxDiscount: 2500,
        usageLimit: 10,
        startDate: new Date().toISOString(),
        endDate: '2026-12-31T23:59:59.000Z',
        isActive: true,
        applicableGames: ['waho-top-up'],
      },
    });
    expect(promotion.status()).toBe(201);
    const promotionPayload = (await promotion.json()) as { promotion: { id: string; code: string } };
    expect(promotionPayload.promotion.code).toBe(promotionCode);

    const promotionPatch = await request.patch(`/api/admin/promotions/${promotionPayload.promotion.id}`, {
      headers: authenticatedHeaders,
      data: { isActive: false },
    });
    expect(promotionPatch.status()).toBe(200);

    const bannerTitle = `E2E WAHO Banner ${uniqueSuffix}`;
    const banner = await request.post('/api/admin/banners', {
      headers: authenticatedHeaders,
      data: {
        title: bannerTitle,
        titleAr: bannerTitle,
        subtitle: 'E2E scheduled WAHO top-up banner',
        subtitleAr: 'E2E scheduled WAHO top-up banner',
        image: '/brand/alwasl-banner.jpg',
        link: '/top-up/waho-top-up',
        gameId: 'waho-top-up',
        startDate: new Date(Date.now() - 60_000).toISOString(),
        endDate: '2026-12-31T23:59:59.000Z',
        isActive: true,
        order: 99,
      },
    });
    expect(banner.status()).toBe(201);
    const bannerPayload = (await banner.json()) as { banner: { id: string; title: string; isActive: boolean } };
    expect(bannerPayload.banner).toMatchObject({ title: bannerTitle, isActive: true });

    const publicBanners = await request.get('/api/banners');
    expect(publicBanners.status()).toBe(200);
    const publicBannerPayload = (await publicBanners.json()) as { banners: Array<{ title: string }> };
    expect(publicBannerPayload.banners.some((item) => item.title === bannerTitle)).toBe(true);

    const bannerPatch = await request.patch(`/api/admin/banners/${bannerPayload.banner.id}`, {
      headers: authenticatedHeaders,
      data: { isActive: false },
    });
    expect(bannerPatch.status()).toBe(200);

    const rate = await request.post('/api/admin/exchange-rates', {
      headers: authenticatedHeaders,
      data: {
        baseCurrencyCode: 'IQD',
        quoteCurrencyCode: 'SAR',
        rate: 0.00275,
        isActive: true,
        note: `E2E ${uniqueSuffix}`,
      },
    });
    expect(rate.status()).toBe(200);
    const ratePayload = (await rate.json()) as { exchangeRate: { baseCurrencyCode: string; quoteCurrencyCode: string; rate: number } };
    expect(ratePayload.exchangeRate).toMatchObject({
      baseCurrencyCode: 'IQD',
      quoteCurrencyCode: 'SAR',
      rate: 0.00275,
    });

    const countryPatch = await request.patch('/api/admin/countries/sa', {
      headers: authenticatedHeaders,
      data: { currencyCode: 'SAR', isActive: true },
    });
    expect(countryPatch.status()).toBe(200);

    const publicCountries = await request.get('/api/countries');
    expect(publicCountries.status()).toBe(200);
    const publicCountriesPayload = (await publicCountries.json()) as {
      countries: Array<{ id: string; currency: string; exchangeRate: number }>;
    };
    expect(publicCountriesPayload.countries.find((country) => country.id === 'sa')).toMatchObject({
      currency: 'SAR',
      exchangeRate: 0.00275,
    });

    const exportResponse = await request.get('/api/admin/export?type=promotions', {
      headers: authenticatedHeaders,
    });
    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(exportResponse.headers()['content-disposition']).toContain('.xlsx');
    const exportBytes = Buffer.from(await exportResponse.body());
    expect(exportBytes.subarray(0, 2).toString()).toBe('PK');
    expect(exportBytes.length).toBeGreaterThan(3000);

    const bannerExportResponse = await request.get('/api/admin/export?type=banners', {
      headers: authenticatedHeaders,
    });
    expect(bannerExportResponse.status()).toBe(200);
    expect(bannerExportResponse.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const bannerExportBytes = Buffer.from(await bannerExportResponse.body());
    expect(bannerExportBytes.subarray(0, 2).toString()).toBe('PK');
    expect(bannerExportBytes.length).toBeGreaterThan(3000);

    const currenciesExportResponse = await request.get('/api/admin/export?type=currencies', {
      headers: authenticatedHeaders,
    });
    expect(currenciesExportResponse.status()).toBe(200);
    expect(currenciesExportResponse.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const currenciesExportBytes = Buffer.from(await currenciesExportResponse.body());
    expect(currenciesExportBytes.subarray(0, 2).toString()).toBe('PK');
    expect(currenciesExportBytes.length).toBeGreaterThan(3000);

    const pricingExportResponse = await request.get('/api/admin/export?type=pricing', {
      headers: authenticatedHeaders,
    });
    expect(pricingExportResponse.status()).toBe(200);
    expect(pricingExportResponse.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const pricingExportBytes = Buffer.from(await pricingExportResponse.body());
    expect(pricingExportBytes.subarray(0, 2).toString()).toBe('PK');
    expect(pricingExportBytes.length).toBeGreaterThan(3000);

    const customerPhone = uniquePhone(`blocked-${testInfo.project.name}`, testInfo.workerIndex);
    const { user: customer, headers: customerHeaders } = await loginWithOtp(request, customerPhone);
    expect(customer.role).toBe('user');

    const walletBefore = await request.get('/api/wallet', { headers: customerHeaders });
    expect(walletBefore.status()).toBe(200);
    const walletBeforePayload = (await walletBefore.json()) as {
      user: { walletBalance: number };
      manualDeposits?: Array<{ id: string; transactionId: string; status: string }>;
    };
    const walletBalanceBefore = walletBeforePayload.user.walletBalance;

    const manualDepositOtp = await request.post('/api/auth/otp/request', {
      headers: customerHeaders,
      data: { purpose: 'WALLET_TOP_UP' },
    });
    expect(manualDepositOtp.status()).toBe(200);
    const manualDepositOtpPayload = (await manualDepositOtp.json()) as { debugOtp?: string };
    expect(manualDepositOtpPayload.debugOtp).toMatch(/^\d{6}$/);

    const manualDepositTransactionId = `E2E-MANUAL-${uniqueSuffix}`;
    const manualDeposit = await request.post('/api/wallet/manual-deposits', {
      headers: customerHeaders,
      data: {
        amount: 5000,
        paymentMethod: 'zaincash',
        transactionId: manualDepositTransactionId.toLowerCase(),
        otp: manualDepositOtpPayload.debugOtp,
      },
    });
    expect(manualDeposit.status()).toBe(201);
    const manualDepositPayload = (await manualDeposit.json()) as {
      manualDeposit: { id: string; amount: number; transactionId: string; status: string };
    };
    expect(manualDepositPayload.manualDeposit).toMatchObject({
      amount: 5000,
      transactionId: manualDepositTransactionId,
      status: 'pending',
    });

    const duplicateDepositOtp = await request.post('/api/auth/otp/request', {
      headers: customerHeaders,
      data: { purpose: 'WALLET_TOP_UP' },
    });
    expect(duplicateDepositOtp.status()).toBe(200);
    const duplicateDepositOtpPayload = (await duplicateDepositOtp.json()) as { debugOtp?: string };

    const duplicateManualDeposit = await request.post('/api/wallet/manual-deposits', {
      headers: customerHeaders,
      data: {
        amount: 5000,
        paymentMethod: 'zaincash',
        transactionId: manualDepositTransactionId,
        otp: duplicateDepositOtpPayload.debugOtp,
      },
    });
    expect(duplicateManualDeposit.status()).toBe(409);
    expect(await duplicateManualDeposit.json()).toEqual({ error: 'Transaction ID already exists' });

    const walletPending = await request.get('/api/wallet', { headers: customerHeaders });
    expect(walletPending.status()).toBe(200);
    const walletPendingPayload = (await walletPending.json()) as {
      user: { walletBalance: number };
      manualDeposits: Array<{ id: string; status: string; transactionId: string }>;
    };
    expect(walletPendingPayload.user.walletBalance).toBe(walletBalanceBefore);
    expect(walletPendingPayload.manualDeposits.find((deposit) => deposit.id === manualDepositPayload.manualDeposit.id)).toMatchObject({
      transactionId: manualDepositTransactionId,
      status: 'pending',
    });

    const approveManualDeposit = await request.patch(`/api/admin/manual-deposits/${manualDepositPayload.manualDeposit.id}`, {
      headers: authenticatedHeaders,
      data: { status: 'APPROVED' },
    });
    expect(approveManualDeposit.status()).toBe(200);
    const approveManualDepositPayload = (await approveManualDeposit.json()) as {
      manualDeposit: { status: string; walletTransactionId?: string };
    };
    expect(approveManualDepositPayload.manualDeposit.status).toBe('approved');
    expect(approveManualDepositPayload.manualDeposit.walletTransactionId).toBeTruthy();

    const walletAfterApproval = await request.get('/api/wallet', { headers: customerHeaders });
    expect(walletAfterApproval.status()).toBe(200);
    const walletAfterApprovalPayload = (await walletAfterApproval.json()) as {
      user: { walletBalance: number };
      transactions: Array<{ reference?: string; amount: number; type: string }>;
    };
    expect(walletAfterApprovalPayload.user.walletBalance).toBe(walletBalanceBefore + 5000);
    expect(walletAfterApprovalPayload.transactions).toContainEqual(
      expect.objectContaining({
        amount: 5000,
        reference: `MANUAL-DEPOSIT:${manualDepositTransactionId}`,
      })
    );

    const accountTypePatch = await request.patch(`/api/admin/users/${customer.id}/account-type`, {
      headers: authenticatedHeaders,
      data: { accountType: 'DISTRIBUTOR' },
    });
    expect(accountTypePatch.status()).toBe(200);
    const accountTypePayload = (await accountTypePatch.json()) as { user: { accountType?: string } };
    expect(accountTypePayload.user.accountType).toBe('distributor');

    const block = await request.patch(`/api/admin/users/${customer.id}/block`, {
      headers: authenticatedHeaders,
      data: {
        isBlocked: true,
        reason: 'E2E customer block check',
      },
    });
    expect(block.status()).toBe(200);
    const blockedPayload = (await block.json()) as { user: { isBlocked: boolean; blockedReason?: string } };
    expect(blockedPayload.user).toMatchObject({
      isBlocked: true,
      blockedReason: 'E2E customer block check',
    });

    expect(baseURL).toBeTruthy();
    const blockedMe = await fetch(`${baseURL}/api/auth/me`, { headers: customerHeaders });
    expect(blockedMe.status).toBe(200);
    expect(await blockedMe.json()).toEqual({ user: null });

    const blockedOrders = await fetch(`${baseURL}/api/orders`, { headers: customerHeaders });
    expect(blockedOrders.status).toBe(401);
    expect(await blockedOrders.json()).toEqual({ error: 'Authentication required' });

    const blockedLogin = await request.post('/api/auth/login', {
      data: { phone: customerPhone },
    });
    expect(blockedLogin.status()).toBe(403);
    expect(await blockedLogin.json()).toEqual({ error: 'Account is blocked' });
  });
});
