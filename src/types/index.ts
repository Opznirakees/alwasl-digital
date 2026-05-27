// User & Authentication Types
export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  level: UserLevel;
  walletBalance: number;
  totalSpent: number;
  registeredAt: string;
  lastLogin: string;
  isVerified: boolean;
  discountPercentage: number;
}

export type UserLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

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
  currency: string;
  currencySymbol: string;
  isActive: boolean;
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

export type GameCategory = 'mobile_game' | 'pc_game' | 'console' | 'gift_card' | 'streaming' | 'social_media' | 'voucher';

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
export type Language = 'en' | 'ar';

// Cart
export interface CartItem {
  gameId: string;
  packageId: string;
  gameUserId: string;
  gameUsername?: string;
  zoneId?: string;
  quantity: number;
}
