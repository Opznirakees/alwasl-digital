import { z } from 'zod';

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

export const createOrderSchema = z.object({
  productSlug: z.string().min(1),
  packageId: z.string().min(1),
  wahoId: z.string().trim().min(3).max(80),
  zoneId: z.string().trim().max(80).optional().or(z.literal('')),
  paymentMethod: z.enum(['wallet', 'zaincash', 'asiahawala', 'card', 'usdt']),
});

export const fakePaymentConfirmSchema = z.object({
  orderId: z.string().min(1),
  success: z.boolean().default(true),
});

export const wahoVerifySchema = z.object({
  wahoId: z.string().trim().min(3).max(80),
});

export const walletTopUpSchema = z.object({
  amount: z.coerce.number().int().min(5000).max(10_000_000),
  paymentMethod: z.enum(['zaincash', 'asiahawala', 'card', 'usdt']).default('zaincash'),
});

export function normalizePhone(phone: string) {
  const compact = phone.replace(/[\s()-]/g, '');
  return compact.startsWith('+') ? compact : `+${compact}`;
}
