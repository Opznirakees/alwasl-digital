import type { Language, OrderStatus } from '@/types';

export type CheckoutStep = 'package' | 'details' | 'payment' | 'confirm';
export type CheckoutStepState = 'complete' | 'current' | 'upcoming';

export const checkoutSteps: Array<{
  id: CheckoutStep;
  label: Record<Language, string>;
}> = [
  { id: 'package', label: { en: 'Amount', ar: 'المبلغ', zh: '金额' } },
  { id: 'details', label: { en: 'WAHO ID', ar: 'معرف WAHO', zh: 'WAHO ID' } },
  { id: 'payment', label: { en: 'Payment', ar: 'الدفع', zh: '付款' } },
  { id: 'confirm', label: { en: 'Confirm', ar: 'تأكيد', zh: '确认' } },
];

export function getCheckoutStepState(
  current: CheckoutStep,
  target: CheckoutStep
): CheckoutStepState {
  const currentIndex = checkoutSteps.findIndex((step) => step.id === current);
  const targetIndex = checkoutSteps.findIndex((step) => step.id === target);

  if (targetIndex < currentIndex) return 'complete';
  if (targetIndex === currentIndex) return 'current';
  return 'upcoming';
}

export function getInitialPackageId(
  packages: Array<{ id: string; amount: number; inStock: boolean }>,
  requestedAmount: string | null
) {
  if (!requestedAmount || !/^\d+$/.test(requestedAmount)) return null;

  const amount = Number(requestedAmount);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;

  return packages.find((item) => item.inStock && item.amount === amount)?.id ?? null;
}

function isSafeInternalPath(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      value.startsWith('/') &&
      !value.startsWith('//') &&
      !value.includes('\\') &&
      !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function getSafeInternalReturnPath(
  value: string | null | undefined,
  fallback = '/'
) {
  if (isSafeInternalPath(value)) return value;
  return isSafeInternalPath(fallback) ? fallback : '/';
}

const orderStatusGuidance: Record<OrderStatus, Record<Language, string>> = {
  pending: {
    en: 'We are waiting for payment confirmation.',
    ar: 'ننتظر تأكيد الدفع.',
    zh: '正在等待付款确认。',
  },
  processing: {
    en: 'Your top-up is being sent to WAHO.',
    ar: 'يتم الآن إرسال الشحن إلى WAHO.',
    zh: '正在向 WAHO 发送充值。',
  },
  completed: {
    en: 'The balance was added to the WAHO account.',
    ar: 'تمت إضافة الرصيد إلى حساب WAHO.',
    zh: '余额已充值到 WAHO 账号。',
  },
  failed: {
    en: 'The top-up did not finish. Contact support with the order ID.',
    ar: 'لم يكتمل الشحن. تواصل مع الدعم وأرسل رقم الطلب.',
    zh: '充值未完成。请将订单号发送给客服。',
  },
  refunded: {
    en: 'The payment was returned. Check your wallet or payment method.',
    ar: 'تمت إعادة المبلغ. تحقق من المحفظة أو طريقة الدفع.',
    zh: '款项已退回。请检查钱包或付款方式。',
  },
  cancelled: {
    en: 'This order was cancelled. You can start a new top-up.',
    ar: 'تم إلغاء الطلب. يمكنك بدء شحن جديد.',
    zh: '订单已取消。您可以重新充值。',
  },
};

export function getOrderStatusGuidance(status: OrderStatus, language: Language) {
  return orderStatusGuidance[status][language];
}
