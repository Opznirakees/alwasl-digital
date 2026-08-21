export type WhatsAppNotificationType =
  | 'ORDER_CREATED'
  | 'OWNER_ORDER_ALERT'
  | 'PAYMENT_RECEIVED'
  | 'TOPUP_SUCCESS'
  | 'TOPUP_FAILURE'
  | 'DELIVERY_CODE'
  | 'ACCOUNT_BLOCKED'
  | 'MARKETING';

type WhatsAppNotificationSubject = 'order' | 'manual-deposit' | 'access-block' | 'batch';

interface WhatsAppNotificationMessageInput {
  type: WhatsAppNotificationType;
  orderId?: string;
  amount?: number;
  currency?: string;
  wahoId?: string;
  productName?: string;
  customerPhone?: string;
  deliveryCode?: string;
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
    if (input.productName) lines.push(`Product: ${input.productName}.`);
    if (input.wahoId) lines.push(`Account ID: ${input.wahoId}.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    lines.push('We will confirm the payment and keep you informed here.');
  }

  if (input.type === 'OWNER_ORDER_ALERT') {
    lines.push(`New order${input.orderId ? ` ${input.orderId}` : ''}.`);
    if (input.productName) lines.push(`Product: ${input.productName}.`);
    if (input.customerPhone) lines.push(`Customer: ${input.customerPhone}.`);
    if (input.wahoId) lines.push(`Account ID: ${input.wahoId}.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    lines.push('Open the admin dashboard to review the order.');
  }

  if (input.type === 'PAYMENT_RECEIVED') {
    lines.push(`Payment received${input.orderId ? ` for order ${input.orderId}` : ''}.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    lines.push('We are processing your order now.');
  }

  if (input.type === 'TOPUP_SUCCESS') {
    lines.push(`${input.productName || 'Top-up'} completed${input.orderId ? ` for order ${input.orderId}` : ''}.`);
    if (input.wahoId) lines.push(`Account ID: ${input.wahoId}.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    lines.push('Thank you for using Al-Wasl Digital.');
  }

  if (input.type === 'TOPUP_FAILURE') {
    lines.push(`Your order${input.orderId ? ` ${input.orderId}` : ''} could not be completed.`);
    if (amount) lines.push(`Amount: ${amount}.`);
    if (input.reason) lines.push(`Reason: ${input.reason}.`);
    lines.push('If payment was captured, the order will be reviewed or refunded.');
  }

  if (input.type === 'DELIVERY_CODE') {
    lines.push(`Order${input.orderId ? ` ${input.orderId}` : ''} is ready.`);
    if (input.productName) lines.push(`Product: ${input.productName}.`);
    if (input.deliveryCode) lines.push(`Your code: ${input.deliveryCode}`);
    lines.push('Keep this message until you have used the code.');
  }

  if (input.type === 'ACCOUNT_BLOCKED') {
    lines.push('Your access has been blocked for this WhatsApp number.');
    if (input.reason) lines.push(`Reason: ${input.reason}.`);
    lines.push('Contact Al-Wasl support if you believe this is incorrect.');
  }

  return lines.join('\n');
}
