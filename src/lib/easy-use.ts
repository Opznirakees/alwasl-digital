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

const manualCodeStatusGuidance: Partial<Record<OrderStatus, Record<Language, string>>> = {
  processing: {
    en: 'The team is preparing your purchased code for private WhatsApp delivery.',
    ar: 'يجهز الفريق الرمز المشترى لإرساله إليك بشكل خاص عبر واتساب.',
    zh: '团队正在准备您购买的代码，并将通过 WhatsApp 私密发送。',
  },
  completed: {
    en: 'Your purchased code was delivered through WhatsApp.',
    ar: 'تم إرسال الرمز المشترى إليك عبر واتساب.',
    zh: '您购买的代码已通过 WhatsApp 发送。',
  },
};

const manualTopupStatusGuidance: Partial<Record<OrderStatus, Record<Language, string>>> = {
  processing: {
    en: 'The team is applying this top-up and will confirm it through WhatsApp.',
    ar: 'ينفذ الفريق هذا الشحن وسيؤكده لك عبر واتساب.',
    zh: '团队正在处理此次充值，并将通过 WhatsApp 确认。',
  },
  completed: {
    en: 'The team completed this top-up and sent a WhatsApp confirmation.',
    ar: 'أكمل الفريق هذا الشحن وأرسل تأكيداً عبر واتساب.',
    zh: '团队已完成此次充值，并发送了 WhatsApp 确认。',
  },
};

export function getOrderStatusGuidance(
  status: OrderStatus,
  language: Language,
  fulfillmentMode: 'waho_api' | 'manual_code' | 'manual_topup' = 'waho_api'
) {
  const manualGuidance = fulfillmentMode === 'manual_code'
    ? manualCodeStatusGuidance[status]
    : fulfillmentMode === 'manual_topup'
      ? manualTopupStatusGuidance[status]
      : undefined;
  return (manualGuidance ?? orderStatusGuidance[status])[language];
}
