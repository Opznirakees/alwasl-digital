import type {
  AdminAuditLog as DbAdminAuditLog,
  Banner as DbBanner,
  Country as DbCountry,
  Currency as DbCurrency,
  CustomPricingRule as DbCustomPricingRule,
  ExchangeRate as DbExchangeRate,
  ManualDeposit as DbManualDeposit,
  Order as DbOrder,
  PaymentAttempt,
  PaymentMethod as DbPaymentMethod,
  PaymentStatus as DbPaymentStatus,
  Provider as DbProvider,
  ProviderAccount as DbProviderAccount,
  ProviderBalanceAlert as DbProviderBalanceAlert,
  Promotion as DbPromotion,
  Product,
  TopupPackage,
  User as DbUser,
  WalletTransaction as DbWalletTransaction,
  WhatsAppNotification as DbWhatsAppNotification,
} from '@prisma/client';
import { getProviderAvailableBalance } from './providers/provider-registry';
import { activeMembershipLevelIds, resolveMembershipForSpend, type AnyMembershipLevel } from '@/lib/membership';
import type {
  AdminAuditLog as AdminAuditLogDto,
  Banner,
  Country,
  Currency,
  CustomPricingRule,
  ExchangeRate,
  Game,
  ManualDeposit,
  Order,
  PaymentMethod,
  PaymentStatus,
  Promotion,
  ProviderBalanceAlert,
  Provider as ProviderDto,
  User,
  UserLevel,
  WalletTransaction,
  WhatsAppNotification,
} from '@/types';

export type ProductWithPackages = Product & { packages: TopupPackage[] };

const levelMap: Record<string, AnyMembershipLevel> = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
};

const reverseLevelMap: Record<UserLevel, string> = {
  bronze: 'BRONZE',
  silver: 'SILVER',
  gold: 'GOLD',
  diamond: 'DIAMOND',
};

function isActiveMembershipLevel(level: AnyMembershipLevel): level is UserLevel {
  return activeMembershipLevelIds.includes(level as UserLevel);
}

const paymentMethodMap: Record<DbPaymentMethod, PaymentMethod> = {
  WALLET: 'wallet',
  ZAINCASH: 'zaincash',
  ASIAHAWALA: 'asiahawala',
  CARD: 'card',
  USDT: 'usdt',
};

const paymentStatusMap: Record<DbPaymentStatus, PaymentStatus> = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export function toDbPaymentMethod(method: PaymentMethod): DbPaymentMethod {
  const values: Record<PaymentMethod, DbPaymentMethod> = {
    wallet: 'WALLET',
    zaincash: 'ZAINCASH',
    asiahawala: 'ASIAHAWALA',
    card: 'CARD',
    usdt: 'USDT',
  };

  return values[method];
}

export function mapUser(user: DbUser): User {
  const membership = resolveMembershipForSpend(user.totalSpent);

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email ?? undefined,
    avatar: user.avatar ?? undefined,
    role: user.role.toLowerCase() as User['role'],
    staffRole: user.staffRole?.toLowerCase() as User['staffRole'],
    staffPermissions: user.staffPermissions,
    accountType: user.accountType.toLowerCase() as User['accountType'],
    level: membership.level,
    walletBalance: user.walletBalance,
    totalSpent: user.totalSpent,
    registeredAt: user.registeredAt.toISOString(),
    lastLogin: (user.lastLogin ?? user.registeredAt).toISOString(),
    isVerified: user.isVerified,
    discountPercentage: membership.discountPercentage,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason ?? undefined,
    blockedAt: user.blockedAt?.toISOString(),
    blockedByAdminId: user.blockedByAdminId ?? undefined,
  };
}

export function mapProduct(product: ProductWithPackages): Game {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    nameAr: product.nameAr,
    description: product.description,
    descriptionAr: product.descriptionAr,
    image: product.image,
    banner: product.banner ?? undefined,
    category: 'social_media',
    publisher: product.publisher,
    isPopular: product.isPopular,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    requiresUserId: product.requiresUserId,
    userIdLabel: product.userIdLabel,
    userIdLabelAr: product.userIdLabelAr,
    userIdPlaceholder: product.userIdPlaceholder,
    userIdPlaceholderAr: product.userIdPlaceholderAr,
    zoneIdRequired: product.zoneIdRequired,
    zoneIdLabel: product.zoneIdLabel ?? undefined,
    zoneIdLabelAr: product.zoneIdLabelAr ?? undefined,
    countries: product.countries,
    packages: product.packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      nameAr: pkg.nameAr,
      amount: pkg.amount,
      unit: pkg.unit,
      unitAr: pkg.unitAr,
      basePrice: pkg.basePrice,
      salePrice: pkg.salePrice ?? undefined,
      currency: pkg.currency,
      inStock: pkg.inStock,
      isPopular: pkg.isPopular,
    })),
  };
}

export function mapOrder(order: DbOrder): Order {
  return {
    id: order.id,
    userId: order.userId,
    gameId: order.productId,
    gameName: order.gameName,
    packageId: order.packageId,
    packageName: order.packageName,
    gameUserId: order.gameUserId,
    gameUsername: order.gameUsername ?? undefined,
    zoneId: order.zoneId ?? undefined,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    totalPrice: order.totalPrice,
    discount: order.discount,
    finalPrice: order.finalPrice,
    currency: order.currency,
    status: order.status.toLowerCase() as Order['status'],
    paymentMethod: paymentMethodMap[order.paymentMethod],
    paymentStatus: paymentStatusMap[order.paymentStatus],
    providerId: order.providerId ?? undefined,
    providerOrderId: order.providerOrderId ?? undefined,
    customPricingRuleId: order.customPricingRuleId ?? undefined,
    pricingSnapshot: order.pricingSnapshot ?? undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    refundedAt: order.refundedAt?.toISOString(),
    refundReason: order.refundReason ?? undefined,
  };
}

type CustomPricingRuleWithRelations = DbCustomPricingRule & {
  product?: Pick<Product, 'id' | 'name'> | null;
  package?: Pick<TopupPackage, 'id' | 'name'> | null;
  user?: Pick<DbUser, 'id' | 'phone'> | null;
};

export function mapCustomPricingRule(rule: CustomPricingRuleWithRelations): CustomPricingRule {
  return {
    id: rule.id,
    name: rule.name,
    targetType: rule.targetType.toLowerCase() as CustomPricingRule['targetType'],
    priceType: rule.priceType.toLowerCase() as CustomPricingRule['priceType'],
    value: rule.value,
    productId: rule.productId ?? undefined,
    productName: rule.product?.name,
    packageId: rule.packageId ?? undefined,
    packageName: rule.package?.name,
    userId: rule.userId ?? undefined,
    userPhone: rule.user?.phone,
    priority: rule.priority,
    isActive: rule.isActive,
    applyMembershipDiscount: rule.applyMembershipDiscount,
    startDate: rule.startDate?.toISOString(),
    endDate: rule.endDate?.toISOString(),
    createdByAdminId: rule.createdByAdminId ?? undefined,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

export function mapWalletTransaction(tx: DbWalletTransaction): WalletTransaction {
  return {
    id: tx.id,
    userId: tx.userId,
    type: tx.type.toLowerCase() as WalletTransaction['type'],
    amount: tx.amount,
    currency: tx.currency,
    balance: tx.balance,
    description: tx.description,
    descriptionAr: tx.descriptionAr,
    reference: tx.reference ?? undefined,
    createdAt: tx.createdAt.toISOString(),
  };
}

type ManualDepositWithRelations = DbManualDeposit & {
  user?: Pick<DbUser, 'id' | 'phone'> | null;
  reviewedByAdmin?: Pick<DbUser, 'id' | 'name'> | null;
};

export function mapManualDeposit(deposit: ManualDepositWithRelations): ManualDeposit {
  return {
    id: deposit.id,
    userId: deposit.userId,
    userPhone: deposit.user?.phone,
    amount: deposit.amount,
    currency: deposit.currency,
    paymentMethod: paymentMethodMap[deposit.paymentMethod],
    transactionId: deposit.transactionId,
    status: deposit.status.toLowerCase() as ManualDeposit['status'],
    note: deposit.note ?? undefined,
    reviewedByAdminId: deposit.reviewedByAdminId ?? undefined,
    reviewedByAdminName: deposit.reviewedByAdmin?.name,
    reviewedAt: deposit.reviewedAt?.toISOString(),
    rejectionReason: deposit.rejectionReason ?? undefined,
    walletTransactionId: deposit.walletTransactionId ?? undefined,
    createdAt: deposit.createdAt.toISOString(),
    updatedAt: deposit.updatedAt.toISOString(),
  };
}

export function mapWhatsAppNotification(notification: DbWhatsAppNotification): WhatsAppNotification {
  return {
    id: notification.id,
    type: notification.type.toLowerCase() as WhatsAppNotification['type'],
    status: notification.status.toLowerCase() as WhatsAppNotification['status'],
    dedupeKey: notification.dedupeKey,
    userId: notification.userId ?? undefined,
    orderId: notification.orderId ?? undefined,
    manualDepositId: notification.manualDepositId ?? undefined,
    createdByAdminId: notification.createdByAdminId ?? undefined,
    batchId: notification.batchId ?? undefined,
    phone: notification.phone,
    message: notification.message,
    providerMessageId: notification.providerMessageId ?? undefined,
    error: notification.error ?? undefined,
    metadata: notification.metadata ?? undefined,
    sentAt: notification.sentAt?.toISOString(),
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  };
}

export function mapPaymentAttempt(attempt: PaymentAttempt) {
  return {
    id: attempt.id,
    orderId: attempt.orderId,
    method: paymentMethodMap[attempt.method],
    status: paymentStatusMap[attempt.status],
    amount: attempt.amount,
    currency: attempt.currency,
    providerRef: attempt.providerRef,
    createdAt: attempt.createdAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
  };
}

type ProviderAccountWithProvider = DbProviderAccount & {
  provider: DbProvider;
};

export function mapProviderAccount(account: ProviderAccountWithProvider): ProviderDto {
  return {
    id: account.id,
    providerCode: account.provider.code,
    name: account.name,
    apiEndpoint: account.apiEndpoint ?? account.provider.apiEndpoint ?? '',
    isActive: account.provider.isActive && account.isActive,
    priority: account.priority,
    supportedGames: account.supportedProducts.length ? account.supportedProducts : account.provider.supportedProducts,
    successRate: account.successRate,
    avgResponseTime: Math.round(account.avgResponseTimeMs / 100) / 10,
    lastHealthCheck: (account.lastHealthCheck ?? account.updatedAt).toISOString(),
    status: account.status.toLowerCase() as ProviderDto['status'],
    accountType: account.type.toLowerCase() as ProviderDto['accountType'],
    fallbackEnabled: account.fallbackEnabled,
    balance: account.balance,
    reservedBalance: account.reservedBalance,
    availableBalance: getProviderAvailableBalance(account),
    lowBalanceThreshold: account.lowBalanceThreshold,
    currency: account.currency,
  };
}

type ProviderBalanceAlertWithAccount = DbProviderBalanceAlert & {
  providerAccount?: (Pick<DbProviderAccount, 'id' | 'name'> & {
    provider?: Pick<DbProvider, 'id' | 'name'> | null;
  }) | null;
};

export function mapProviderBalanceAlert(alert: ProviderBalanceAlertWithAccount): ProviderBalanceAlert {
  return {
    id: alert.id,
    providerAccountId: alert.providerAccountId,
    providerAccountName: alert.providerAccount?.name,
    providerName: alert.providerAccount?.provider?.name,
    status: alert.status.toLowerCase() as ProviderBalanceAlert['status'],
    balance: alert.balance,
    reservedBalance: alert.reservedBalance,
    availableBalance: alert.availableBalance,
    threshold: alert.threshold,
    currency: alert.currency,
    message: alert.message,
    channels: alert.channels,
    whatsappPhone: alert.whatsappPhone ?? undefined,
    whatsappMessageId: alert.whatsappMessageId ?? undefined,
    notifiedAt: alert.notifiedAt?.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString(),
    lastError: alert.lastError ?? undefined,
    createdAt: alert.createdAt.toISOString(),
    updatedAt: alert.updatedAt.toISOString(),
  };
}

export function mapPromotion(promotion: DbPromotion): Promotion {
  return {
    id: promotion.id,
    code: promotion.code,
    type: promotion.type.toLowerCase() as Promotion['type'],
    value: promotion.value,
    minPurchase: promotion.minPurchase,
    maxDiscount: promotion.maxDiscount ?? undefined,
    usageLimit: promotion.usageLimit,
    usedCount: promotion.usedCount,
    startDate: promotion.startDate.toISOString(),
    endDate: promotion.endDate.toISOString(),
    isActive: promotion.isActive,
    applicableGames: promotion.applicableProducts,
    applicableLevels: promotion.applicableLevels
      .map((level) => levelMap[level] ?? 'bronze')
      .filter(isActiveMembershipLevel),
  };
}

export function mapBanner(banner: DbBanner): Banner {
  return {
    id: banner.id,
    title: banner.title,
    titleAr: banner.titleAr,
    subtitle: banner.subtitle ?? undefined,
    subtitleAr: banner.subtitleAr ?? undefined,
    image: banner.image,
    link: banner.link ?? undefined,
    gameId: banner.productId ?? undefined,
    startDate: banner.startDate.toISOString(),
    endDate: banner.endDate.toISOString(),
    isActive: banner.isActive,
    order: banner.sortOrder,
  };
}

export type CountryWithCurrency = DbCountry & { currency: DbCurrency };

export function mapCurrency(currency: DbCurrency): Currency {
  return {
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    decimalPlaces: currency.decimalPlaces,
    isActive: currency.isActive,
  };
}

export function mapCountry(country: CountryWithCurrency, exchangeRate?: DbExchangeRate | null, baseCurrency = 'IQD'): Country {
  const rate = country.currencyCode === baseCurrency ? 1 : Number(exchangeRate?.rate ?? 0);

  return {
    id: country.id,
    code: country.code,
    name: country.name,
    nameAr: country.nameAr,
    flag: country.flag,
    phoneCode: country.phoneCode,
    currency: country.currencyCode,
    currencySymbol: country.currency.symbol,
    currencyName: country.currency.name,
    decimalPlaces: country.currency.decimalPlaces,
    exchangeRate: rate,
    exchangeRateBase: baseCurrency,
    exchangeRateUpdatedAt: exchangeRate?.updatedAt.toISOString(),
    isActive: country.isActive,
  };
}

export function mapExchangeRate(rate: DbExchangeRate): ExchangeRate {
  return {
    id: rate.id,
    baseCurrencyCode: rate.baseCurrencyCode,
    quoteCurrencyCode: rate.quoteCurrencyCode,
    rate: Number(rate.rate),
    isActive: rate.isActive,
    source: rate.source,
    note: rate.note ?? undefined,
    updatedByAdminId: rate.updatedByAdminId ?? undefined,
    updatedAt: rate.updatedAt.toISOString(),
  };
}

export function toDbUserLevel(level: UserLevel) {
  return reverseLevelMap[level] ?? 'BRONZE';
}

type AdminAuditLogWithAdmin = DbAdminAuditLog & {
  admin?: Pick<DbUser, 'id' | 'name' | 'phone' | 'role'> | null;
};

export function mapAdminAuditLog(log: AdminAuditLogWithAdmin): AdminAuditLogDto {
  return {
    id: log.id,
    adminId: log.adminId ?? undefined,
    adminName: log.admin?.name,
    adminPhone: log.admin?.phone,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId ?? undefined,
    metadata: log.metadata ?? undefined,
    ipAddress: log.ipAddress ?? undefined,
    userAgent: log.userAgent ?? undefined,
    createdAt: log.createdAt.toISOString(),
  };
}
