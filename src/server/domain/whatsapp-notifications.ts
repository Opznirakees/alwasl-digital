export type WhatsAppNotificationType =
  | 'ORDER_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'TOPUP_SUCCESS'
  | 'TOPUP_FAILURE'
  | 'ACCOUNT_BLOCKED'
  | 'MARKETING';

type WhatsAppNotificationSubject = 'order' | 'manual-deposit' | 'access-block' | 'batch';

interface WhatsAppNotificationMessageInput {
  type: WhatsAppNotificationType;
  orderId?: string;
  amount?: number;
  currency?: string;
  wahoId?: string;
  reason?: string;
  marketingMessage?: string;
}

function formatAmount(amount?: number, currency = 'IQD') {
  if (amount === undefined) return undefined;
  return `${new Intl.NumberFormat('en-IQ').format(amount)} ${currency}`;
}

export function createWhatsAppNotificationDedupeKey(
  type: WhatsAppNotificationType,
  subject: WhatsAppNotificationSubject,
  subjectId: string,
  recipientId?: string
) {
  return [type, subject, subjectId, recipientId].filter(Boolean).join(':');
}

export function createWhatsAppNotificationMessage(input: WhatsAppNotificationMessageInput) {
  if (input.type === 'MARKETING') return input.marketingMessage?.trim() ?? '';

  const amount = formatAmount(input.amount, input.currency);
  const lines = ['Al-Wasl Digital'];

  if (input.type === 'ORDER_CREATED') {
    lines.push(`Order${input.orderId ? ` ${input.orderId}` : ''} received.`);
    if (input.wahoId) lines.push(`WAHO ID: ${input.wahoId}.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    lines.push('We will confirm the payment and keep you informed here.');
  }

  if (input.type === 'PAYMENT_RECEIVED') {
    lines.push(`Payment received${input.orderId ? ` for order ${input.orderId}` : ''}.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    lines.push('We are processing your WAHO top-up now.');
  }

  if (input.type === 'TOPUP_SUCCESS') {
    lines.push(`WAHO top-up completed${input.orderId ? ` for order ${input.orderId}` : ''}.`);
    if (input.wahoId) lines.push(`WAHO ID: ${input.wahoId}.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    lines.push('Thank you for using Al-Wasl Digital.');
  }

  if (input.type === 'TOPUP_FAILURE') {
    lines.push(`Your WAHO top-up${input.orderId ? ` for order ${input.orderId}` : ''} could not be completed.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    if (input.reason) lines.push(`Reason: ${input.reason}.`);
    lines.push('If payment was captured, the order will be reviewed or refunded.');
  }

  if (input.type === 'ACCOUNT_BLOCKED') {
    lines.push('Your access has been blocked for this WhatsApp number.');
    if (input.reason) lines.push(`Reason: ${input.reason}.`);
    lines.push('Contact Al-Wasl support if you believe this is incorrect.');
  }

  return lines.join('\n');
}
