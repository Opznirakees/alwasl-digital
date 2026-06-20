import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { banners, countries, demoUser, games, promotions } from '../src/data/mock-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/alwasl_digital?schema=public',
  }),
});

async function main() {
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? demoUser.phone;
  const product = games[0];
  const currencySeeds = [
    { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع', decimalPlaces: 0 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimalPlaces: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', decimalPlaces: 2 },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ', decimalPlaces: 3 },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', decimalPlaces: 3 },
  ];
  const manualExchangeRates = [
    { baseCurrencyCode: 'IQD', quoteCurrencyCode: 'SAR', rate: 0.00275 },
    { baseCurrencyCode: 'IQD', quoteCurrencyCode: 'AED', rate: 0.00280 },
    { baseCurrencyCode: 'IQD', quoteCurrencyCode: 'EGP', rate: 0.03650 },
    { baseCurrencyCode: 'IQD', quoteCurrencyCode: 'JOD', rate: 0.00054 },
    { baseCurrencyCode: 'IQD', quoteCurrencyCode: 'KWD', rate: 0.00023 },
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
        flag: country.flag,
        phoneCode: country.phoneCode,
        currencyCode: country.currency,
        isActive: country.isActive,
      },
      create: {
        id: country.id,
        code: country.code,
        name: country.name,
        nameAr: country.nameAr,
        flag: country.flag,
        phoneCode: country.phoneCode,
        currencyCode: country.currency,
        isActive: country.isActive,
      },
    });
  }

  for (const rate of manualExchangeRates) {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrencyCode_quoteCurrencyCode: {
          baseCurrencyCode: rate.baseCurrencyCode,
          quoteCurrencyCode: rate.quoteCurrencyCode,
        },
      },
      update: {
        rate: rate.rate,
        isActive: true,
        source: 'manual',
        note: 'Seeded manual exchange rate',
      },
      create: {
        baseCurrencyCode: rate.baseCurrencyCode,
        quoteCurrencyCode: rate.quoteCurrencyCode,
        rate: rate.rate,
        isActive: true,
        source: 'manual',
        note: 'Seeded manual exchange rate',
      },
    });
  }

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
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      image: product.image,
      banner: product.banner,
      category: 'SOCIAL_MEDIA',
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
      countries: product.countries,
    },
    create: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      image: product.image,
      banner: product.banner,
      category: 'SOCIAL_MEDIA',
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
      countries: product.countries,
    },
  });

  for (const [index, pkg] of product.packages.entries()) {
    await prisma.topupPackage.upsert({
      where: { id: pkg.id },
      update: {
        productId: product.id,
        name: pkg.name,
        nameAr: pkg.nameAr,
        amount: pkg.amount,
        unit: pkg.unit,
        unitAr: pkg.unitAr,
        basePrice: pkg.basePrice,
        salePrice: pkg.salePrice,
        currency: pkg.currency,
        inStock: pkg.inStock,
        isPopular: pkg.isPopular ?? false,
        sortOrder: index,
      },
      create: {
        id: pkg.id,
        productId: product.id,
        name: pkg.name,
        nameAr: pkg.nameAr,
        amount: pkg.amount,
        unit: pkg.unit,
        unitAr: pkg.unitAr,
        basePrice: pkg.basePrice,
        salePrice: pkg.salePrice,
        currency: pkg.currency,
        inStock: pkg.inStock,
        isPopular: pkg.isPopular ?? false,
        sortOrder: index,
      },
    });
  }

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
        link: banner.link,
        productId: banner.gameId ?? product.id,
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
        link: banner.link,
        productId: banner.gameId ?? product.id,
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
