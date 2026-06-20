import { z } from 'zod';
import { activeMembershipLevelOptions } from '@/lib/membership';
import { staffPermissions, staffRoles } from './permissions';

export const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(/^\+?[1-9]\d{7,18}$/);

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/),
});

export const otpCodeSchema = z.string().regex(/^\d{6}$/);

export const sensitiveOtpPurposeSchema = z.enum(['ORDER_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'WALLET_TOP_UP', 'WALLET_CHANGE']);

export const sensitiveOtpRequestSchema = z.object({
  purpose: sensitiveOtpPurposeSchema,
});

export const createOrderSchema = z.object({
  productSlug: z.string().min(1),
  packageId: z.string().min(1),
  wahoId: z.string().trim().min(3).max(80),
  zoneId: z.string().trim().max(80).optional().or(z.literal('')),
  paymentMethod: z.enum(['wallet', 'zaincash', 'asiahawala', 'card', 'usdt']),
  otp: otpCodeSchema.optional(),
});

export const fakePaymentConfirmSchema = z.object({
  orderId: z.string().min(1),
  success: z.boolean().default(true),
  otp: otpCodeSchema.optional(),
});

export const refundOrderSchema = z.object({
  reason: z.string().trim().min(3).max(240).optional(),
  otp: otpCodeSchema.optional(),
});

export const wahoVerifySchema = z.object({
  wahoId: z.string().trim().min(3).max(80),
});

export const walletTopUpSchema = z.object({
  amount: z.coerce.number().int().min(5000).max(10_000_000),
  paymentMethod: z.enum(['zaincash', 'asiahawala', 'card', 'usdt']).default('zaincash'),
  otp: otpCodeSchema.optional(),
});

export const manualDepositTransactionIdSchema = z
  .string()
  .trim()
  .min(4)
  .max(80)
  .regex(/^[A-Za-z0-9._:-]+$/);

export const createManualDepositSchema = z.object({
  amount: z.coerce.number().int().min(5000).max(100_000_000),
  paymentMethod: z.enum(['zaincash', 'asiahawala', 'card', 'usdt']),
  transactionId: manualDepositTransactionIdSchema,
  note: z.string().trim().max(240).optional().or(z.literal('')),
  otp: otpCodeSchema.optional(),
});

export const reviewManualDepositSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().trim().max(240).optional(),
}).refine((payload) => payload.status !== 'REJECTED' || Boolean(payload.reason?.trim()), {
  message: 'A rejection reason is required',
  path: ['reason'],
});

export const updateAdminProductSchema = z.object({
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one product field is required',
});

export const createAdminTopupPackageSchema = z.object({
  productId: z.string().trim().min(1).default('waho-top-up'),
  amount: z.coerce.number().int().min(1).max(1_000_000_000),
  basePrice: z.coerce.number().int().min(1).max(1_000_000_000),
  salePrice: z.coerce.number().int().min(1).max(1_000_000_000).nullable().optional(),
  currency: z.string().trim().min(3).max(8).default('IQD'),
  inStock: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  nameAr: z.string().trim().min(1).max(120).optional(),
  unit: z.string().trim().min(1).max(40).default('IQD top-up'),
  unitAr: z.string().trim().min(1).max(40).default('شحن د.ع'),
});

export const updateAdminTopupPackageSchema = z.object({
  basePrice: z.coerce.number().int().min(1).max(1_000_000_000).optional(),
  salePrice: z.coerce.number().int().min(1).max(1_000_000_000).nullable().optional(),
  inStock: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one top-up package field is required',
});

const optionalAdminRelationId = z.string().trim().min(1).max(120).nullable().optional();
const customPricingBaseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  targetType: z.enum(['ALL', 'CUSTOMER', 'DISTRIBUTOR', 'USER']).default('ALL'),
  priceType: z.enum(['FIXED_PRICE', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT']),
  value: z.coerce.number().int().min(0).max(1_000_000_000),
  productId: optionalAdminRelationId,
  packageId: optionalAdminRelationId,
  userId: optionalAdminRelationId,
  priority: z.coerce.number().int().min(0).max(100_000).default(100),
  isActive: z.boolean().default(true),
  applyMembershipDiscount: z.boolean().default(false),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

function refineCustomPricingRule<T extends z.infer<typeof customPricingBaseSchema>>(payload: T, context: z.RefinementCtx) {
  if (payload.targetType === 'USER' && !payload.userId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A user is required for user-specific pricing',
      path: ['userId'],
    });
  }

  if (payload.targetType !== 'USER' && payload.userId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'User can only be set for user-specific pricing',
      path: ['userId'],
    });
  }

  if (payload.priceType === 'PERCENTAGE_DISCOUNT' && payload.value > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discounts cannot exceed 100',
      path: ['value'],
    });
  }

  if (payload.startDate && payload.endDate && new Date(payload.endDate) <= new Date(payload.startDate)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pricing rule end date must be after start date',
      path: ['endDate'],
    });
  }
}

export const createAdminCustomPricingRuleSchema = customPricingBaseSchema.superRefine(refineCustomPricingRule);

export const updateAdminCustomPricingRuleSchema = customPricingBaseSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one pricing rule field is required',
}).superRefine((payload, context) => {
  if (payload.priceType === 'PERCENTAGE_DISCOUNT' && payload.value !== undefined && payload.value > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discounts cannot exceed 100',
      path: ['value'],
    });
  }
});

export const createAdminProviderAccountSchema = z.object({
  providerId: z.string().trim().min(1).default('provider-waho-top-up'),
  name: z.string().trim().min(2).max(120),
  type: z.enum(['WAHO_API', 'WAHA_WHATSAPP', 'MOCK']).default('WAHA_WHATSAPP'),
  apiEndpoint: z.string().trim().max(240).optional().or(z.literal('')),
  isActive: z.boolean().default(false),
  priority: z.coerce.number().int().min(1).max(10_000).default(10),
  fallbackEnabled: z.boolean().default(true),
  balance: z.coerce.number().int().min(0).max(10_000_000_000).default(0),
  minBalance: z.coerce.number().int().min(0).max(10_000_000_000).default(0),
  lowBalanceThreshold: z.coerce.number().int().min(0).max(10_000_000_000).default(0),
  currency: z.string().trim().min(3).max(8).default('IQD'),
  supportedProducts: z.array(z.string().trim().min(1)).min(1).default(['waho-top-up']),
});

export const updateAdminProviderAccountSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  apiEndpoint: z.string().trim().max(240).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  priority: z.coerce.number().int().min(1).max(10_000).optional(),
  fallbackEnabled: z.boolean().optional(),
  balance: z.coerce.number().int().min(0).max(10_000_000_000).optional(),
  minBalance: z.coerce.number().int().min(0).max(10_000_000_000).optional(),
  lowBalanceThreshold: z.coerce.number().int().min(0).max(10_000_000_000).optional(),
  status: z.enum(['ONLINE', 'DEGRADED', 'OFFLINE']).optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one provider account field is required',
});

export const adminPromotionLevelsSchema = z.array(z.enum(activeMembershipLevelOptions)).default([...activeMembershipLevelOptions]);

export const createAdminPromotionSchema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[A-Z0-9_-]+$/),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().int().min(1).max(1_000_000_000),
  minPurchase: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  maxDiscount: z.coerce.number().int().min(0).max(1_000_000_000).nullable().optional(),
  usageLimit: z.coerce.number().int().min(1).max(10_000_000).default(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true),
  applicableGames: z.array(z.string().trim().min(1)).default(['waho-top-up']),
  applicableLevels: adminPromotionLevelsSchema,
}).refine((payload) => new Date(payload.endDate) > new Date(payload.startDate), {
  message: 'Promotion end date must be after start date',
  path: ['endDate'],
});

export const updateAdminPromotionSchema = z.object({
  type: z.enum(['percentage', 'fixed']).optional(),
  value: z.coerce.number().int().min(1).max(1_000_000_000).optional(),
  minPurchase: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  maxDiscount: z.coerce.number().int().min(0).max(1_000_000_000).nullable().optional(),
  usageLimit: z.coerce.number().int().min(1).max(10_000_000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  applicableGames: z.array(z.string().trim().min(1)).optional(),
  applicableLevels: adminPromotionLevelsSchema.optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one promotion field is required',
});

export const createAdminBannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  titleAr: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(240).optional().or(z.literal('')),
  subtitleAr: z.string().trim().max(240).optional().or(z.literal('')),
  image: z.string().trim().min(1).max(240),
  link: z.string().trim().max(240).optional().or(z.literal('')),
  gameId: z.string().trim().min(1).max(120).optional().or(z.literal('')),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(100_000).default(0),
}).refine((payload) => new Date(payload.endDate) > new Date(payload.startDate), {
  message: 'Banner end date must be after start date',
  path: ['endDate'],
});

export const updateAdminBannerSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  titleAr: z.string().trim().min(2).max(120).optional(),
  subtitle: z.string().trim().max(240).optional().or(z.literal('')),
  subtitleAr: z.string().trim().max(240).optional().or(z.literal('')),
  image: z.string().trim().min(1).max(240).optional(),
  link: z.string().trim().max(240).optional().or(z.literal('')),
  gameId: z.string().trim().min(1).max(120).optional().or(z.literal('')),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(100_000).optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one banner field is required',
});

export const currencyCodeSchema = z.string().trim().regex(/^[A-Z]{3,8}$/);

export const updateAdminCountrySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  nameAr: z.string().trim().min(2).max(120).optional(),
  flag: z.string().trim().min(1).max(16).optional(),
  phoneCode: z.string().trim().regex(/^\+[1-9][0-9]{0,5}$/).optional(),
  currencyCode: currencyCodeSchema.optional(),
  isActive: z.boolean().optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one country field is required',
});

export const createAdminExchangeRateSchema = z.object({
  baseCurrencyCode: currencyCodeSchema.default('IQD'),
  quoteCurrencyCode: currencyCodeSchema,
  rate: z.coerce.number().positive().max(1_000_000),
  isActive: z.boolean().default(true),
  note: z.string().trim().max(240).optional().or(z.literal('')),
}).refine((payload) => payload.baseCurrencyCode !== payload.quoteCurrencyCode, {
  message: 'Exchange rate currencies must be different',
  path: ['quoteCurrencyCode'],
});

export const marketingWhatsAppSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  target: z.enum(['all', 'customers', 'distributors', 'users', 'phones']).default('all'),
  userIds: z.array(z.string().trim().min(1).max(120)).max(200).optional(),
  phones: z.array(z.string().trim().min(8).max(32)).max(200).optional(),
}).superRefine((payload, context) => {
  if (payload.target === 'users' && !payload.userIds?.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select at least one user',
      path: ['userIds'],
    });
  }

  if (payload.target === 'phones' && !payload.phones?.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter at least one phone number',
      path: ['phones'],
    });
  }
});

export const adminExportSchema = z.object({
  type: z.enum(['orders', 'users', 'wallets', 'providers', 'promotions', 'banners', 'currencies', 'pricing', 'whatsapp', 'revenue']),
});

const reportDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reportPeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const reportQuerySchema = z.object({
  period: reportPeriodSchema.default('daily'),
  from: reportDateSchema.optional(),
  to: reportDateSchema.optional(),
}).superRefine((payload, context) => {
  if (Boolean(payload.from) !== Boolean(payload.to)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Both from and to dates are required for a custom report range',
      path: payload.from ? ['to'] : ['from'],
    });
  }

  if (payload.from && payload.to && payload.to <= payload.from) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Report end date must be after start date',
      path: ['to'],
    });
  }
});

export const adminReportExportSchema = reportQuerySchema;

export const adminUserBlockSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().trim().min(3).max(240).optional(),
}).refine((payload) => !payload.isBlocked || Boolean(payload.reason?.trim()), {
  message: 'A block reason is required',
  path: ['reason'],
});

export const adminUserAccountTypeSchema = z.object({
  accountType: z.enum(['CUSTOMER', 'DISTRIBUTOR']),
});

export const adminUserPermissionsSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'STAFF']),
  staffRole: z.enum(staffRoles).nullable().optional(),
  staffPermissions: z.array(z.enum(staffPermissions)).default([]),
}).superRefine((payload, context) => {
  if (payload.role === 'STAFF' && !payload.staffRole) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A staff role is required for staff users',
      path: ['staffRole'],
    });
  }

  if (payload.role !== 'STAFF' && payload.staffRole) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Staff role can only be set for staff users',
      path: ['staffRole'],
    });
  }
});

export function normalizePhone(phone: string) {
  const compact = phone.replace(/[\s()-]/g, '');
  return compact.startsWith('+') ? compact : `+${compact}`;
}
