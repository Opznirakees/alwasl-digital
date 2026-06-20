// User & Authentication Types
export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: UserRole;
  staffRole?: StaffRole;
  staffPermissions: StaffPermission[];
  accountType?: UserAccountType;
  level: UserLevel;
  walletBalance: number;
  totalSpent: number;
  registeredAt: string;
  lastLogin: string;
  isVerified: boolean;
  discountPercentage: number;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  blockedByAdminId?: string;
}

export type UserRole = 'user' | 'admin' | 'staff';
export type StaffRole = 'owner' | 'operations' | 'support' | 'finance' | 'marketing' | 'viewer';
export type StaffPermission =
  | 'ADMIN_DASHBOARD_VIEW'
  | 'ORDER_READ'
  | 'ORDER_MANAGE'
  | 'ORDER_REFUND'
  | 'USER_READ'
  | 'USER_MANAGE'
  | 'WALLET_READ'
  | 'WALLET_MANAGE'
  | 'MANUAL_DEPOSIT_REVIEW'
  | 'PRODUCT_MANAGE'
  | 'PROVIDER_MANAGE'
  | 'PROMOTION_MANAGE'
  | 'BANNER_MANAGE'
  | 'CURRENCY_MANAGE'
  | 'PRICING_MANAGE'
  | 'EXPORT_DATA'
  | 'WHATSAPP_MARKETING'
  | 'MONITORING_MANAGE'
  | 'JOB_RUN';
export type UserAccountType = 'customer' | 'distributor';
export type UserLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Country Types
export interface Country {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  flag: string;
  phoneCode: string;
  currency: string;
  currencySymbol: string;
  currencyName?: string;
  decimalPlaces?: number;
  exchangeRate?: number;
  exchangeRateBase?: string;
  exchangeRateUpdatedAt?: string;
  isActive: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

export interface ExchangeRate {
  id: string;
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number;
  isActive: boolean;
  source: string;
  note?: string;
  updatedByAdminId?: string;
  updatedAt: string;
}

// Product Types
export interface Game {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  banner?: string;
  category: GameCategory;
  publisher: string;
  isPopular: boolean;
  isFeatured: boolean;
  isActive: boolean;
  requiresUserId: boolean;
  userIdLabel: string;
  userIdLabelAr: string;
  userIdPlaceholder: string;
  userIdPlaceholderAr: string;
  zoneIdRequired: boolean;
  zoneIdLabel?: string;
  zoneIdLabelAr?: string;
  countries: string[];
  packages: GamePackage[];
}

export type GameCategory = 'top_up' | 'app' | 'game' | 'mobile_game' | 'pc_game' | 'console' | 'gift_card' | 'streaming' | 'social_media' | 'voucher';

export interface GamePackage {
  id: string;
  name: string;
  nameAr: string;
  amount: number;
  unit: string;
  unitAr: string;
  basePrice: number;
  salePrice?: number;
  currency: string;
  inStock: boolean;
  isPopular?: boolean;
}

export type CustomPricingRuleTargetType = 'all' | 'customer' | 'distributor' | 'user';
export type CustomPricingRulePriceType = 'fixed_price' | 'percentage_discount' | 'fixed_discount';

export interface CustomPricingRule {
  id: string;
  name: string;
  targetType: CustomPricingRuleTargetType;
  priceType: CustomPricingRulePriceType;
  value: number;
  productId?: string;
  productName?: string;
  packageId?: string;
  packageName?: string;
  userId?: string;
  userPhone?: string;
  priority: number;
  isActive: boolean;
  applyMembershipDiscount: boolean;
  startDate?: string;
  endDate?: string;
  createdByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  gameUserId: string;
  gameUsername?: string;
  zoneId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  providerId?: string;
  providerOrderId?: string;
  customPricingRuleId?: string;
  pricingSnapshot?: unknown;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  refundedAt?: string;
  refundReason?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'wallet' | 'zaincash' | 'asiahawala' | 'card' | 'usdt';

// Provider Types
export interface Provider {
  id: string;
  name: string;
  apiEndpoint: string;
  isActive: boolean;
  priority: number;
  supportedGames: string[];
  successRate: number;
  avgResponseTime: number;
  lastHealthCheck: string;
  status: 'online' | 'offline' | 'degraded';
  providerCode?: string;
  accountType?: 'waho_api' | 'waha_whatsapp' | 'mock';
  fallbackEnabled?: boolean;
  balance?: number;
  reservedBalance?: number;
  availableBalance?: number;
  lowBalanceThreshold?: number;
  currency?: string;
}

export interface ProviderBalanceAlert {
  id: string;
  providerAccountId: string;
  providerAccountName?: string;
  providerName?: string;
  status: 'open' | 'notified' | 'resolved';
  balance: number;
  reservedBalance: number;
  availableBalance: number;
  threshold: number;
  currency: string;
  message: string;
  channels: string[];
  whatsappPhone?: string;
  whatsappMessageId?: string;
  notifiedAt?: string;
  resolvedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

// Wallet Types
export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  balance: number;
  description: string;
  descriptionAr: string;
  reference?: string;
  createdAt: string;
}

export type WalletTransactionType = 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'bonus' | 'cashback';

export type ManualDepositStatus = 'pending' | 'approved' | 'rejected';

export interface ManualDeposit {
  id: string;
  userId: string;
  userPhone?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  status: ManualDepositStatus;
  note?: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  walletTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppNotificationType = 'payment_received' | 'topup_success' | 'topup_failure' | 'marketing';
export type WhatsAppNotificationStatus = 'pending' | 'sent' | 'failed';

export interface WhatsAppNotification {
  id: string;
  type: WhatsAppNotificationType;
  status: WhatsAppNotificationStatus;
  dedupeKey: string;
  userId?: string;
  orderId?: string;
  manualDepositId?: string;
  createdByAdminId?: string;
  batchId?: string;
  phone: string;
  message: string;
  providerMessageId?: string;
  error?: string;
  metadata?: unknown;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Promotion Types
export interface Banner {
  id: string;
  title: string;
  titleAr: string;
  subtitle?: string;
  subtitleAr?: string;
  image: string;
  link?: string;
  gameId?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  order: number;
}

export interface Promotion {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableGames: string[];
  applicableLevels: UserLevel[];
}

// Admin Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
  refundRate: number;
}

export interface AdminAuditLog {
  id: string;
  adminId?: string;
  adminName?: string;
  adminPhone?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export type MonitoringEventSeverity = 'info' | 'warning' | 'error' | 'critical';
export type MonitoringCheckStatus = 'unknown' | 'up' | 'down' | 'degraded';

export interface MonitoringTarget {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'HEAD';
  expectedStatus: number;
  timeoutMs: number;
  intervalMinutes: number;
  isActive: boolean;
  lastStatus: MonitoringCheckStatus;
  lastCheckedAt?: string;
  lastLatencyMs?: number;
  lastStatusCode?: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringEvent {
  id: string;
  severity: MonitoringEventSeverity;
  source: string;
  message: string;
  status?: MonitoringCheckStatus;
  targetId?: string;
  targetName?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  latencyMs?: number;
  requestId?: string;
  metadata?: unknown;
  createdAt: string;
}

export interface MonitoringSettings {
  id: string;
  logRetentionDays: number;
  uptimeEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringDashboard {
  settings: MonitoringSettings;
  targets: MonitoringTarget[];
  events: MonitoringEvent[];
  summary: {
    activeTargets: number;
    downTargets: number;
    errorEvents24h: number;
    criticalEvents24h: number;
    lastEventAt?: string;
  };
  external: {
    healthEndpoint: string;
    errorWebhookConfigured: boolean;
    statusWebhookConfigured: boolean;
  };
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  refunds: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'wallet' | 'promotion' | 'system';
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  isRead: boolean;
  createdAt: string;
}

// Language
export type Language = 'en' | 'ar' | 'zh';

// Cart
export interface CartItem {
  gameId: string;
  packageId: string;
  gameUserId: string;
  gameUsername?: string;
  zoneId?: string;
  quantity: number;
}
