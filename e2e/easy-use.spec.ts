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
  image: '/brand/alwasl-mark.jpg',
  category: 'top_up',
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

const countries = [
  { id: 'iq', code: 'IQ', name: 'Iraq', nameAr: 'العراق', flag: '🇮🇶', phoneCode: '+964', currency: 'IQD', currencySymbol: 'د.ع', decimalPlaces: 0, exchangeRate: 1, isActive: true },
  { id: 'nl', code: 'NL', name: 'Netherlands', nameAr: 'هولندا', flag: '🇳🇱', phoneCode: '+31', currency: 'EUR', currencySymbol: '€', decimalPlaces: 2, exchangeRate: 0.00065, isActive: true },
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
  paymentStatus: 'paid',
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
    if (path === '/api/banners') return json({ banners: [] });
    if (path === '/api/products') return json({ products: [product] });
    if (path === '/api/products/waho-top-up') return json({ product });
    if (path === '/api/promotions') return json({ promotions: [] });
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

    return json({ error: `Unhandled test route: ${method} ${path}` }, 404);
  });
}

async function mockAdminApi(page: Page) {
  await page.route('**/api/**', async (route: Route) => {
    const path = new URL(route.request().url()).pathname;
    const json = (payload: unknown, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

    if (path === '/api/countries') return json({ countries });
    if (path === '/api/auth/me') return json({ user: adminUser });
    if (path === '/api/orders') return json({ orders: [order] });
    if (path === '/api/wallet') return json({ user: adminUser, transactions: [walletTransaction], manualDeposits: [] });
    if (path === '/api/admin/summary') {
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

    return json({ error: `Unhandled admin test route: ${route.request().method()} ${path}` }, 404);
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
  test('makes the one WAHO task obvious on a small phone', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Top up your WAHO balance' })).toBeVisible();
    await expect(page.getByTestId('home-primary-topup')).toHaveAccessibleName('Choose amount');
    await expect(page.getByRole('link', { name: 'Choose 10,000 IQD' })).toHaveAttribute('href', /amount=10000/);

    const mobileTabs = page.locator('[data-mobile-tab-bar]');
    await expect(mobileTabs).toBeVisible();
    await expect(mobileTabs.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'home-mobile');
  });

  test('keeps the smallest phone compact, tappable and clear to the final footer link', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await mockCustomerApi(page);
    await page.goto('/');

    const primaryAction = page.getByTestId('home-primary-topup');
    const primaryActionBox = await primaryAction.boundingBox();
    expect(primaryActionBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const mobileTabBoxes = await page.locator('[data-mobile-tab-bar] a').evaluateAll((links) => (
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
    expect(firstCard?.width ?? 0).toBeGreaterThan(120);
    expect(secondCard?.width ?? 0).toBeGreaterThan(120);
    expect(Math.abs((firstCard?.y ?? 0) - (secondCard?.y ?? 100))).toBeLessThan(3);
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
    await mockCustomerApi(page);
    await page.goto('/top-up/waho-top-up?amount=10000');

    await expect(page.getByRole('navigation', { name: 'Top-up progress' })).toContainText('Amount');
    await expect(page.getByRole('navigation', { name: 'Top-up progress' })).toContainText('WAHO ID');
    const selectedAmount = page.locator('button[aria-pressed="true"]').filter({ hasText: '10,000' });
    await expect(selectedAmount).toHaveCount(1);
    await expect(selectedAmount).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Continue with 10,000 IQD' }).click();
    const detailsHeading = page.getByRole('heading', { name: 'Enter your WAHO ID' });
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

    await page.getByRole('button', { name: 'Continue with 10,000 IQD' }).click();
    await page.getByRole('textbox', { name: 'WAHO ID', exact: true }).fill('123456789');
    await page.getByRole('button', { name: 'Check ID' }).click();
    await expect(page.getByText('Account found', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue to payment' }).click();

    await expect(page.getByRole('heading', { name: 'How do you want to pay?' })).toBeFocused();
    await expect(page.getByText('Payment is checked before the top-up starts.').first()).toBeVisible();
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

  test('keeps Chinese, Arabic RTL and dark mode complete', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCustomerApi(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitem', { name: '中文' }).click();
    await expect(page.getByRole('heading', { level: 1, name: '为您的 WAHO 余额充值' })).toBeVisible();
    await captureVisual(page, testInfo.project.name, 'home-chinese-dark-mobile');

    await page.getByRole('button', { name: '切换语言' }).click();
    await page.getByRole('menuitem', { name: 'العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1, name: 'اشحن رصيد WAHO' })).toBeVisible();

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
    await expect(page.getByRole('heading', { level: 1, name: 'اشحن رصيد WAHO' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'home-arabic-dark-desktop');
  });

  test('uses wide screens for overview without stretching the main task', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCustomerApi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Top up your WAHO balance' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Choose 10,000 IQD' })).toBeVisible();
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
    await mockCustomerApi(page);

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
    await mockCustomerApi(page);

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
        expect(selectedCardBox?.width ?? 0).toBeGreaterThan(120);
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
    await expectNoHorizontalOverflow(page);
    await captureVisual(page, testInfo.project.name, 'admin-orders-mobile');
  });
});
