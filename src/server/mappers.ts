import type {
  Order as DbOrder,
  PaymentAttempt,
  PaymentMethod as DbPaymentMethod,
  PaymentStatus as DbPaymentStatus,
  Product,
  TopupPackage,
  User as DbUser,
  WalletTransaction as DbWalletTransaction,
} from '@prisma/client';
import type { Game, Order, PaymentMethod, PaymentStatus, User, UserLevel, WalletTransaction } from '@/types';

export type ProductWithPackages = Product & { packages: TopupPackage[] };

const levelMap: Record<string, UserLevel> = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
};

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
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email ?? undefined,
    avatar: user.avatar ?? undefined,
    role: user.role.toLowerCase() as User['role'],
    level: levelMap[user.level] ?? 'bronze',
    walletBalance: user.walletBalance,
    totalSpent: user.totalSpent,
    registeredAt: user.registeredAt.toISOString(),
    lastLogin: (user.lastLogin ?? user.registeredAt).toISOString(),
    isVerified: user.isVerified,
    discountPercentage: user.discountPercentage,
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
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    refundedAt: order.refundedAt?.toISOString(),
    refundReason: order.refundReason ?? undefined,
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
