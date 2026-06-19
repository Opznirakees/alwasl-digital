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
  const login = await request.post('/api/auth/login', {
    data: { phone },
  });
  expect(login.status()).toBe(200);

  const loginPayload = (await login.json()) as { debugOtp?: string };
  expect(loginPayload.debugOtp).toMatch(/^\d{6}$/);

  const verify = await request.post('/api/auth/verify', {
    data: { phone, otp: loginPayload.debugOtp },
  });
  expect(verify.status()).toBe(200);

  const setCookie = verify.headers()['set-cookie'];
  const sessionCookie = setCookie?.match(/alwasl_session=([^;]+)/)?.[1];
  expect(sessionCookie).toBeTruthy();

  return {
    user: ((await verify.json()) as { user: { phone: string; role: string } }).user,
    headers: { Cookie: `alwasl_session=${sessionCookie}` },
  };
}

test.describe('WAHO production smoke', () => {
  test('renders the WAHO top-up journey from seeded product data', async ({ page, request }) => {
    const { product, firstPackage } = await loadWahoProduct(request);

    await page.goto('/');
    await expect(page.getByRole('link', { name: /WAHO Top-Up/i }).first()).toBeVisible();

    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/products/waho-top-up') && response.ok()),
      page.goto('/top-up'),
    ]);
    await expect(page.locator('main')).toContainText('WAHO Top-Up', { timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Start top-up/i })).toBeVisible({ timeout: 15_000 });

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
    expect(walletTopUp.status()).toBe(424);
    expect(await walletTopUp.json()).toEqual({ error: 'Payment is temporarily unavailable' });

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
    expect(payload.auditLogs?.[0]).toMatchObject({
      action: 'admin.summary.view',
      entityType: 'admin_dashboard',
      adminPhone,
    });
  });
});
