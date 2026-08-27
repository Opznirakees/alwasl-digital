import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { banners, countries, demoUser, games, promotions } from '../src/data/mock-data';
import { asiacellWahoPackages, mastercardWahoPackages } from '../src/data/catalog-seeds';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/alwasl_digital?schema=public',
  }),
});

async function main() {
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? demoUser.phone;
  const product = games[0];
  const allCountryIds = countries.map((country) => country.id);
  const currencySeeds = [...new Map([
    ['USD', { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 }],
    ...countries.map((country) => [country.currency, {
      code: country.currency,
      name: country.currencyName ?? country.currency,
      symbol: country.currencySymbol,
      decimalPlaces: country.decimalPlaces ?? 2,
    }] as const),
  ]).values()];
  const manualExchangeRates = [
    { baseCurrencyCode: 'IQD', quoteCurrencyCode: 'USD', rate: 0.000763 },
    ...countries
      .filter((country) => country.currency !== 'IQD' && Number(country.exchangeRate) > 0)
      .map((country) => ({
        baseCurrencyCode: 'IQD',
        quoteCurrencyCode: country.currency,
        rate: Number(country.exchangeRate),
      })),
  ];
  const providerInitialBalance = Number.parseInt(process.env.WAHO_PROVIDER_INITIAL_BALANCE ?? '100000000', 10);
  const providerLowBalanceThreshold = Number.parseInt(process.env.WAHO_PROVIDER_LOW_BALANCE_THRESHOLD ?? '10000000', 10);
  const hasWahaConfig = Boolean(
    process.env.WAHA_BASE_URL?.trim() &&
      process.env.WAHA_API_KEY?.trim() &&
      process.env.WAHO_FULFILLMENT_PHONE?.trim()
  );
  const mockWahoEnabled = process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_WAHO === 'true';

  for (const currency of currencySeeds) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        name: currency.name,
        symbol: currency.symbol,
        decimalPlaces: currency.decimalPlaces,
        isActive: true,
      },
      create: {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        decimalPlaces: currency.decimalPlaces,
        isActive: true,
      },
    });
  }

  for (const country of countries) {
    await prisma.country.upsert({
      where: { id: country.id },
      update: {
        code: country.code,
        name: country.name,
        nameAr: country.nameAr,
        nameZh: country.nameZh,
        flag: country.flag,
        phoneCode: country.phoneCode,
        currencyCode: country.currency,
        primaryPriceCurrency: country.primaryPriceCurrency,
        showPricesInIqd: country.showPricesInIqd,
        showPricesInUsd: country.showPricesInUsd,
        showPricesInLocal: country.showPricesInLocal,
        isActive: country.isActive,
      },
      create: {
        id: country.id,
        code: country.code,
        name: country.name,
        nameAr: country.nameAr,
        nameZh: country.nameZh,
        flag: country.flag,
        phoneCode: country.phoneCode,
        currencyCode: country.currency,
        primaryPriceCurrency: country.primaryPriceCurrency,
        showPricesInIqd: country.showPricesInIqd,
        showPricesInUsd: country.showPricesInUsd,
        showPricesInLocal: country.showPricesInLocal,
        isActive: country.isActive,
      },
    });
  }

  for (const rate of manualExchangeRates) {
    const existingRate = await prisma.exchangeRate.findFirst({
      where: {
        baseCurrencyCode: rate.baseCurrencyCode,
        quoteCurrencyCode: rate.quoteCurrencyCode,
      },
      select: { id: true },
    });
    if (!existingRate) {
      await prisma.exchangeRate.create({
        data: {
          baseCurrencyCode: rate.baseCurrencyCode,
          quoteCurrencyCode: rate.quoteCurrencyCode,
          rate: rate.rate,
          isActive: true,
          source: 'manual-seed-2026-08-21',
          note: 'Admin-editable initial IQD conversion rate',
          effectiveFrom: new Date('2026-08-21T00:00:00.000Z'),
        },
      });
    }
  }

  await prisma.catalogCategory.upsert({
    where: { id: 'waho' },
    update: {
      slug: 'waho',
      name: 'WAHO',
      nameAr: 'واهو',
      nameZh: 'WAHO',
      description: 'Choose a WAHO recharge route after secure WhatsApp login.',
      descriptionAr: 'اختر طريقة شحن واهو بعد تسجيل الدخول الآمن عبر واتساب.',
      descriptionZh: '通过 WhatsApp 安全登录后选择 WAHO 充值方式。',
      image: '/brand/waho-app-icon.webp',
      accentColor: '#9bd8f2',
      sortOrder: 10,
      isActive: true,
      priceVisibility: 'AUTHENTICATED',
    },
    create: {
      id: 'waho',
      slug: 'waho',
      name: 'WAHO',
      nameAr: 'واهو',
      nameZh: 'WAHO',
      description: 'Choose a WAHO recharge route after secure WhatsApp login.',
      descriptionAr: 'اختر طريقة شحن واهو بعد تسجيل الدخول الآمن عبر واتساب.',
      descriptionZh: '通过 WhatsApp 安全登录后选择 WAHO 充值方式。',
      image: '/brand/waho-app-icon.webp',
      accentColor: '#9bd8f2',
      sortOrder: 10,
      isActive: true,
      priceVisibility: 'AUTHENTICATED',
    },
  });

  await prisma.catalogCategory.upsert({
    where: { id: 'asiacell' },
    update: {
      slug: 'asiacell',
      name: 'Asiacell',
      nameAr: 'آسياسيل',
      nameZh: 'Asiacell',
      description: 'Order a WAHO recharge code with the Asiacell price list.',
      descriptionAr: 'اطلب رمز شحن واهو وفق قائمة أسعار آسياسيل.',
      descriptionZh: '按 Asiacell 价目表订购 WAHO 充值码。',
      image: '/brand/asiacell-category.svg',
      accentColor: '#f6b7cc',
      sortOrder: 20,
      isActive: true,
      priceVisibility: 'PUBLIC',
    },
    create: {
      id: 'asiacell',
      slug: 'asiacell',
      name: 'Asiacell',
      nameAr: 'آسياسيل',
      nameZh: 'Asiacell',
      description: 'Order a WAHO recharge code with the Asiacell price list.',
      descriptionAr: 'اطلب رمز شحن واهو وفق قائمة أسعار آسياسيل.',
      descriptionZh: '按 Asiacell 价目表订购 WAHO 充值码。',
      image: '/brand/asiacell-category.svg',
      accentColor: '#f6b7cc',
      sortOrder: 20,
      isActive: true,
      priceVisibility: 'PUBLIC',
    },
  });

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      name: 'Al-Wasl Admin',
      role: 'ADMIN',
      level: 'BRONZE',
      walletBalance: 250000,
      totalSpent: 0,
      isVerified: true,
      discountPercentage: 0,
    },
    create: {
      phone: adminPhone,
      name: 'Al-Wasl Admin',
      email: 'admin@alwasl.digital',
      avatar: demoUser.avatar,
      role: 'ADMIN',
      level: 'BRONZE',
      walletBalance: 250000,
      totalSpent: 0,
      isVerified: true,
      discountPercentage: 0,
      lastLogin: new Date(),
    },
  });

  await prisma.product.upsert({
    where: { id: product.id },
    update: {
      slug: product.slug,
      name: 'WAHO MasterCard Recharge',
      nameAr: 'شحن واهو - ماستر كارد',
      nameZh: 'WAHO MasterCard 充值',
      description: 'Recharge WAHO balance using the MasterCard price list.',
      descriptionAr: 'اشحن رصيد واهو وفق قائمة أسعار ماستر كارد.',
      descriptionZh: '按 MasterCard 价目表充值 WAHO 余额。',
      image: product.image,
      banner: product.banner,
      category: 'TOP_UP',
      catalogCategoryId: 'waho',
      fulfillmentMode: 'WAHO_API',
      publisher: product.publisher,
      isPopular: product.isPopular,
      isFeatured: product.isFeatured,
      isActive: true,
      requiresUserId: product.requiresUserId,
      userIdLabel: product.userIdLabel,
      userIdLabelAr: product.userIdLabelAr,
      userIdPlaceholder: product.userIdPlaceholder,
      userIdPlaceholderAr: product.userIdPlaceholderAr,
      zoneIdRequired: product.zoneIdRequired,
      zoneIdLabel: product.zoneIdLabel,
      zoneIdLabelAr: product.zoneIdLabelAr,
      countries: allCountryIds,
    },
    create: {
      id: product.id,
      slug: product.slug,
      name: 'WAHO MasterCard Recharge',
      nameAr: 'شحن واهو - ماستر كارد',
      nameZh: 'WAHO MasterCard 充值',
      description: 'Recharge WAHO balance using the MasterCard price list.',
      descriptionAr: 'اشحن رصيد واهو وفق قائمة أسعار ماستر كارد.',
      descriptionZh: '按 MasterCard 价目表充值 WAHO 余额。',
      image: product.image,
      banner: product.banner,
      category: 'TOP_UP',
      catalogCategoryId: 'waho',
      fulfillmentMode: 'WAHO_API',
      publisher: product.publisher,
      isPopular: product.isPopular,
      isFeatured: product.isFeatured,
      isActive: true,
      requiresUserId: product.requiresUserId,
      userIdLabel: product.userIdLabel,
      userIdLabelAr: product.userIdLabelAr,
      userIdPlaceholder: product.userIdPlaceholder,
      userIdPlaceholderAr: product.userIdPlaceholderAr,
      zoneIdRequired: product.zoneIdRequired,
      zoneIdLabel: product.zoneIdLabel,
      zoneIdLabelAr: product.zoneIdLabelAr,
      countries: allCountryIds,
    },
  });

  const mastercardPackageIds: string[] = [];
  for (const [index, pkg] of mastercardWahoPackages.entries()) {
    const id = `waho-mastercard-${pkg.balance}`;
    mastercardPackageIds.push(id);
    await prisma.topupPackage.upsert({
      where: { id },
      update: {
        productId: product.id,
        name: `${pkg.balance.toLocaleString('en-IQ')} WAHO balance`,
        nameAr: `${pkg.balance.toLocaleString('en-IQ')} رصيد واهو`,
        amount: pkg.balance,
        unit: 'WAHO balance',
        unitAr: 'رصيد واهو',
        basePrice: pkg.priceIqd,
        salePrice: null,
        currency: 'IQD',
        inStock: true,
        isPopular: pkg.priceIqd === 25_000,
        sortOrder: index,
      },
      create: {
        id,
        productId: product.id,
        name: `${pkg.balance.toLocaleString('en-IQ')} WAHO balance`,
        nameAr: `${pkg.balance.toLocaleString('en-IQ')} رصيد واهو`,
        amount: pkg.balance,
        unit: 'WAHO balance',
        unitAr: 'رصيد واهو',
        basePrice: pkg.priceIqd,
        currency: 'IQD',
        inStock: true,
        isPopular: pkg.priceIqd === 25_000,
        sortOrder: index,
      },
    });
  }

  await prisma.topupPackage.updateMany({
    where: { productId: product.id, id: { notIn: mastercardPackageIds } },
    data: { inStock: false },
  });

  const asiacellProductId = 'waho-asiacell-code';
  await prisma.product.upsert({
    where: { id: asiacellProductId },
    update: {
      slug: asiacellProductId,
      name: 'WAHO via Asiacell',
      nameAr: 'واهو عبر آسياسيل',
      nameZh: '通过 Asiacell 充值 WAHO',
      description: 'Buy a manually delivered WAHO recharge code using the Asiacell price list.',
      descriptionAr: 'اشترِ رمز شحن واهو يتم تسليمه يدوياً وفق أسعار آسياسيل.',
      descriptionZh: '按 Asiacell 价目表购买人工交付的 WAHO 充值码。',
      image: '/brand/asiacell-category.svg',
      banner: '/brand/recharge-hero-v3.webp',
      category: 'TOP_UP',
      catalogCategoryId: 'asiacell',
      fulfillmentMode: 'MANUAL_CODE',
      publisher: 'Al-Wasl Digital',
      isPopular: true,
      isFeatured: true,
      isActive: true,
      requiresUserId: false,
      userIdLabel: 'Delivery',
      userIdLabelAr: 'التسليم',
      userIdPlaceholder: 'Delivered by WhatsApp',
      userIdPlaceholderAr: 'يتم التسليم عبر واتساب',
      zoneIdRequired: false,
      countries: allCountryIds,
    },
    create: {
      id: asiacellProductId,
      slug: asiacellProductId,
      name: 'WAHO via Asiacell',
      nameAr: 'واهو عبر آسياسيل',
      nameZh: '通过 Asiacell 充值 WAHO',
      description: 'Buy a manually delivered WAHO recharge code using the Asiacell price list.',
      descriptionAr: 'اشترِ رمز شحن واهو يتم تسليمه يدوياً وفق أسعار آسياسيل.',
      descriptionZh: '按 Asiacell 价目表购买人工交付的 WAHO 充值码。',
      image: '/brand/asiacell-category.svg',
      banner: '/brand/recharge-hero-v3.webp',
      category: 'TOP_UP',
      catalogCategoryId: 'asiacell',
      fulfillmentMode: 'MANUAL_CODE',
      publisher: 'Al-Wasl Digital',
      isPopular: true,
      isFeatured: true,
      isActive: true,
      requiresUserId: false,
      userIdLabel: 'Delivery',
      userIdLabelAr: 'التسليم',
      userIdPlaceholder: 'Delivered by WhatsApp',
      userIdPlaceholderAr: 'يتم التسليم عبر واتساب',
      zoneIdRequired: false,
      countries: allCountryIds,
    },
  });

  const asiacellPackageIds: string[] = [];
  for (const [index, pkg] of asiacellWahoPackages.entries()) {
    const id = `waho-asiacell-${pkg.balance}`;
    asiacellPackageIds.push(id);
    await prisma.topupPackage.upsert({
      where: { id },
      update: {
        productId: asiacellProductId,
        name: `${pkg.balance.toLocaleString('en-IQ')} WAHO balance code`,
        nameAr: `رمز رصيد واهو ${pkg.balance.toLocaleString('en-IQ')}`,
        amount: pkg.balance,
        unit: 'WAHO balance code',
        unitAr: 'رمز رصيد واهو',
        basePrice: pkg.priceIqd,
        salePrice: null,
        currency: 'IQD',
        inStock: true,
        isPopular: pkg.priceIqd === 15_000,
        sortOrder: index,
      },
      create: {
        id,
        productId: asiacellProductId,
        name: `${pkg.balance.toLocaleString('en-IQ')} WAHO balance code`,
        nameAr: `رمز رصيد واهو ${pkg.balance.toLocaleString('en-IQ')}`,
        amount: pkg.balance,
        unit: 'WAHO balance code',
        unitAr: 'رمز رصيد واهو',
        basePrice: pkg.priceIqd,
        currency: 'IQD',
        inStock: true,
        isPopular: pkg.priceIqd === 15_000,
        sortOrder: index,
      },
    });
  }

  await prisma.topupPackage.updateMany({
    where: { productId: asiacellProductId, id: { notIn: asiacellPackageIds } },
    data: { inStock: false },
  });

  for (const promotion of promotions) {
    await prisma.promotion.upsert({
      where: { code: promotion.code },
      update: {
        type: promotion.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        value: promotion.value,
        minPurchase: promotion.minPurchase,
        maxDiscount: promotion.maxDiscount,
        usageLimit: promotion.usageLimit,
        usedCount: promotion.usedCount,
        startDate: new Date(promotion.startDate),
        endDate: new Date(promotion.endDate),
        isActive: promotion.isActive,
        applicableProducts: promotion.applicableGames,
        applicableLevels: promotion.applicableLevels.map((level) => level.toUpperCase() as 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND'),
      },
      create: {
        code: promotion.code,
        type: promotion.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        value: promotion.value,
        minPurchase: promotion.minPurchase,
        maxDiscount: promotion.maxDiscount,
        usageLimit: promotion.usageLimit,
        usedCount: promotion.usedCount,
        startDate: new Date(promotion.startDate),
        endDate: new Date(promotion.endDate),
        isActive: promotion.isActive,
        applicableProducts: promotion.applicableGames,
        applicableLevels: promotion.applicableLevels.map((level) => level.toUpperCase() as 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND'),
      },
    });
  }

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: {
        title: banner.title,
        titleAr: banner.titleAr,
        subtitle: banner.subtitle,
        subtitleAr: banner.subtitleAr,
        image: banner.image,
        mobileImage: banner.mobileImage,
        link: banner.link,
        productId: banner.gameId ?? null,
        startDate: new Date(banner.startDate),
        endDate: new Date(banner.endDate),
        isActive: banner.isActive,
        sortOrder: banner.order,
      },
      create: {
        id: banner.id,
        title: banner.title,
        titleAr: banner.titleAr,
        subtitle: banner.subtitle,
        subtitleAr: banner.subtitleAr,
        image: banner.image,
        mobileImage: banner.mobileImage,
        link: banner.link,
        productId: banner.gameId ?? null,
        startDate: new Date(banner.startDate),
        endDate: new Date(banner.endDate),
        isActive: banner.isActive,
        sortOrder: banner.order,
      },
    });
  }

  await prisma.provider.upsert({
    where: { id: 'provider-waho-top-up' },
    update: {
      code: 'waho-top-up',
      name: 'WAHO Top-Up Provider Network',
      service: 'WAHO_TOP_UP',
      apiEndpoint: process.env.WAHO_API_BASE_URL?.trim() || 'waho://not-configured',
      isActive: hasWahaConfig || mockWahoEnabled,
      priority: 1,
      supportedProducts: [product.slug],
    },
    create: {
      id: 'provider-waho-top-up',
      code: 'waho-top-up',
      name: 'WAHO Top-Up Provider Network',
      service: 'WAHO_TOP_UP',
      apiEndpoint: process.env.WAHO_API_BASE_URL?.trim() || 'waho://not-configured',
      isActive: hasWahaConfig || mockWahoEnabled,
      priority: 1,
      supportedProducts: [product.slug],
    },
  });

  await prisma.providerAccount.upsert({
    where: { id: 'provider-account-waha-whatsapp-primary' },
    update: {
      providerId: 'provider-waho-top-up',
      name: 'WAHA WhatsApp Fulfillment Primary',
      type: 'WAHA_WHATSAPP',
      apiEndpoint: process.env.WAHA_BASE_URL?.trim() || 'waha://api/sendText',
      isActive: hasWahaConfig,
      priority: 1,
      fallbackEnabled: true,
      balance: hasWahaConfig ? providerInitialBalance : 0,
      reservedBalance: 0,
      minBalance: 0,
      lowBalanceThreshold: hasWahaConfig ? providerLowBalanceThreshold : 0,
      currency: 'IQD',
      successRate: hasWahaConfig ? 100 : 0,
      avgResponseTimeMs: 200,
      status: hasWahaConfig ? 'DEGRADED' : 'OFFLINE',
      supportedProducts: [product.slug],
      config: {
        wahaBaseUrlEnv: 'WAHA_BASE_URL',
        wahaApiKeyEnv: 'WAHA_API_KEY',
        wahaSessionEnv: 'WAHA_SESSION',
        wahoFulfillmentPhoneEnv: 'WAHO_FULFILLMENT_PHONE',
      },
    },
    create: {
      id: 'provider-account-waha-whatsapp-primary',
      providerId: 'provider-waho-top-up',
      name: 'WAHA WhatsApp Fulfillment Primary',
      type: 'WAHA_WHATSAPP',
      apiEndpoint: process.env.WAHA_BASE_URL?.trim() || 'waha://api/sendText',
      isActive: hasWahaConfig,
      priority: 1,
      fallbackEnabled: true,
      balance: hasWahaConfig ? providerInitialBalance : 0,
      reservedBalance: 0,
      minBalance: 0,
      lowBalanceThreshold: hasWahaConfig ? providerLowBalanceThreshold : 0,
      currency: 'IQD',
      successRate: hasWahaConfig ? 100 : 0,
      avgResponseTimeMs: 200,
      status: hasWahaConfig ? 'DEGRADED' : 'OFFLINE',
      supportedProducts: [product.slug],
      config: {
        wahaBaseUrlEnv: 'WAHA_BASE_URL',
        wahaApiKeyEnv: 'WAHA_API_KEY',
        wahaSessionEnv: 'WAHA_SESSION',
        wahoFulfillmentPhoneEnv: 'WAHO_FULFILLMENT_PHONE',
      },
    },
  });

  await prisma.providerAccount.upsert({
    where: { id: 'provider-account-waho-api-reserve' },
    update: {
      providerId: 'provider-waho-top-up',
      name: 'Native WAHO API Reserve',
      type: 'WAHO_API',
      apiEndpoint: process.env.WAHO_API_BASE_URL?.trim() || 'waho://api-not-configured',
      isActive: false,
      priority: 2,
      fallbackEnabled: true,
      balance: 0,
      reservedBalance: 0,
      minBalance: 0,
      lowBalanceThreshold: 0,
      currency: 'IQD',
      successRate: 0,
      avgResponseTimeMs: 0,
      status: 'OFFLINE',
      supportedProducts: [product.slug],
      config: {
        wahoApiBaseUrlEnv: 'WAHO_API_BASE_URL',
        wahoApiKeyEnv: 'WAHO_API_KEY',
      },
    },
    create: {
      id: 'provider-account-waho-api-reserve',
      providerId: 'provider-waho-top-up',
      name: 'Native WAHO API Reserve',
      type: 'WAHO_API',
      apiEndpoint: process.env.WAHO_API_BASE_URL?.trim() || 'waho://api-not-configured',
      isActive: false,
      priority: 2,
      fallbackEnabled: true,
      balance: 0,
      reservedBalance: 0,
      minBalance: 0,
      lowBalanceThreshold: 0,
      currency: 'IQD',
      successRate: 0,
      avgResponseTimeMs: 0,
      status: 'OFFLINE',
      supportedProducts: [product.slug],
      config: {
        wahoApiBaseUrlEnv: 'WAHO_API_BASE_URL',
        wahoApiKeyEnv: 'WAHO_API_KEY',
      },
    },
  });

  await prisma.providerAccount.upsert({
    where: { id: 'provider-account-waho-local-mock' },
    update: {
      providerId: 'provider-waho-top-up',
      name: 'Local WAHO Mock',
      type: 'MOCK',
      apiEndpoint: 'mock://waho-local',
      isActive: mockWahoEnabled,
      priority: 99,
      fallbackEnabled: false,
      balance: mockWahoEnabled ? providerInitialBalance : 0,
      reservedBalance: 0,
      minBalance: 0,
      lowBalanceThreshold: mockWahoEnabled ? providerLowBalanceThreshold : 0,
      currency: 'IQD',
      successRate: mockWahoEnabled ? 100 : 0,
      avgResponseTimeMs: 50,
      status: mockWahoEnabled ? 'DEGRADED' : 'OFFLINE',
      supportedProducts: [product.slug],
      config: {},
    },
    create: {
      id: 'provider-account-waho-local-mock',
      providerId: 'provider-waho-top-up',
      name: 'Local WAHO Mock',
      type: 'MOCK',
      apiEndpoint: 'mock://waho-local',
      isActive: mockWahoEnabled,
      priority: 99,
      fallbackEnabled: false,
      balance: mockWahoEnabled ? providerInitialBalance : 0,
      reservedBalance: 0,
      minBalance: 0,
      lowBalanceThreshold: mockWahoEnabled ? providerLowBalanceThreshold : 0,
      currency: 'IQD',
      successRate: mockWahoEnabled ? 100 : 0,
      avgResponseTimeMs: 50,
      status: mockWahoEnabled ? 'DEGRADED' : 'OFFLINE',
      supportedProducts: [product.slug],
      config: {},
    },
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { phone: adminPhone } });
  const existingInitialDeposit = await prisma.walletTransaction.findFirst({
    where: { userId: admin.id, reference: 'SEED-WALLET-BALANCE' },
  });

  if (!existingInitialDeposit) {
    await prisma.walletTransaction.create({
      data: {
        userId: admin.id,
        type: 'DEPOSIT',
        amount: 250000,
        currency: 'IQD',
        balance: 250000,
        description: 'Initial seeded wallet balance',
        descriptionAr: 'رصيد محفظة أولي',
        reference: 'SEED-WALLET-BALANCE',
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
