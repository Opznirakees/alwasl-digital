export type WhatsAppNotificationType = 'PAYMENT_RECEIVED' | 'TOPUP_SUCCESS' | 'TOPUP_FAILURE' | 'MARKETING';

type WhatsAppNotificationSubject = 'order' | 'manual-deposit' | 'batch';

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

  return lines.join('\n');
}
