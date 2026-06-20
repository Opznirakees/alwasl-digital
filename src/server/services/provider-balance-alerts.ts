import type { Provider, ProviderAccount } from '@prisma/client';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../providers/waha-whatsapp';

type ProviderAccountWithProvider = ProviderAccount & {
  provider: Provider;
};

interface ProviderBalanceAlertOptions {
  env?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch;
}

const activeAlertStatuses = ['OPEN', 'NOTIFIED'] as const;

export function getProviderAccountAvailableBalance(
  account: Pick<ProviderAccount, 'balance' | 'reservedBalance' | 'minBalance'>
) {
  return Math.max(account.balance - account.reservedBalance - account.minBalance, 0);
}

export function isProviderLowBalance(account: Pick<ProviderAccount, 'balance' | 'reservedBalance' | 'minBalance' | 'lowBalanceThreshold'>) {
  return getProviderAccountAvailableBalance(account) <= account.lowBalanceThreshold;
}

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat('en-IQ').format(amount)} ${currency}`;
}

export function createProviderLowBalanceMessage(account: ProviderAccountWithProvider) {
  const availableBalance = getProviderAccountAvailableBalance(account);

  return [
    'Provider low balance alert',
    '',
    `Provider: ${account.provider.name}`,
    `Account: ${account.name}`,
    `Available balance: ${formatAmount(availableBalance, account.currency)}`,
    `Threshold: ${formatAmount(account.lowBalanceThreshold, account.currency)}`,
    `Total balance: ${formatAmount(account.balance, account.currency)}`,
    `Reserved balance: ${formatAmount(account.reservedBalance, account.currency)}`,
    '',
    'Please top up this provider account or switch fulfillment capacity.',
  ].join('\n');
}

async function loadProviderAccount(accountId: string) {
  return prisma.providerAccount.findUnique({
    where: { id: accountId },
    include: { provider: true },
  });
}

async function findActiveAlert(providerAccountId: string) {
  return prisma.providerBalanceAlert.findFirst({
    where: {
      providerAccountId,
      status: { in: [...activeAlertStatuses] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function notifyProviderLowBalance(alertId: string, message: string, options: ProviderBalanceAlertOptions = {}) {
  const phone = options.env?.PROVIDER_ALERT_WHATSAPP_PHONE?.trim() || process.env.PROVIDER_ALERT_WHATSAPP_PHONE?.trim();
  if (!phone) {
    await prisma.providerBalanceAlert.update({
      where: { id: alertId },
      data: {
        status: 'OPEN',
        channels: ['admin'],
        lastError: 'PROVIDER_ALERT_WHATSAPP_NOT_CONFIGURED',
      },
    });
    return;
  }

  try {
    const result = await sendWhatsAppText(phone, message, {
      env: options.env,
      fetcher: options.fetcher,
      onFailure: (error) => {
        console.warn('Provider low balance WhatsApp alert failed', { code: error.message });
      },
    });

    await prisma.providerBalanceAlert.update({
      where: { id: alertId },
      data: {
        status: 'NOTIFIED',
        channels: ['admin', 'whatsapp'],
        whatsappPhone: phone,
        whatsappMessageId: result.messageId,
        notifiedAt: new Date(),
        lastError: null,
      },
    });
  } catch (error) {
    await prisma.providerBalanceAlert.update({
      where: { id: alertId },
      data: {
        status: 'OPEN',
        channels: ['admin'],
        lastError: error instanceof Error ? error.message : 'WAHA_SEND_FAILED',
      },
    });
  }
}

export async function evaluateProviderBalanceAlert(
  account: ProviderAccountWithProvider,
  options: ProviderBalanceAlertOptions = {}
) {
  const availableBalance = getProviderAccountAvailableBalance(account);
  const existingAlert = await findActiveAlert(account.id);

  if (!account.provider.isActive || !account.isActive) {
    if (existingAlert) {
      return prisma.providerBalanceAlert.update({
        where: { id: existingAlert.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          balance: account.balance,
          reservedBalance: account.reservedBalance,
          availableBalance,
          threshold: account.lowBalanceThreshold,
          lastError: null,
        },
      });
    }

    return null;
  }

  if (!isProviderLowBalance(account)) {
    if (existingAlert) {
      return prisma.providerBalanceAlert.update({
        where: { id: existingAlert.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          balance: account.balance,
          reservedBalance: account.reservedBalance,
          availableBalance,
          threshold: account.lowBalanceThreshold,
        },
      });
    }

    return null;
  }

  if (existingAlert) {
    return prisma.providerBalanceAlert.update({
      where: { id: existingAlert.id },
      data: {
        balance: account.balance,
        reservedBalance: account.reservedBalance,
        availableBalance,
        threshold: account.lowBalanceThreshold,
      },
    });
  }

  const message = createProviderLowBalanceMessage(account);
  const alert = await prisma.providerBalanceAlert.create({
    data: {
      providerAccountId: account.id,
      status: 'OPEN',
      balance: account.balance,
      reservedBalance: account.reservedBalance,
      availableBalance,
      threshold: account.lowBalanceThreshold,
      currency: account.currency,
      message,
      channels: ['admin'],
    },
  });

  await notifyProviderLowBalance(alert.id, message, options);
  return prisma.providerBalanceAlert.findUnique({ where: { id: alert.id } });
}

export async function evaluateProviderBalanceAlertByAccountId(
  providerAccountId: string,
  options: ProviderBalanceAlertOptions = {}
) {
  const account = await loadProviderAccount(providerAccountId);
  if (!account) return null;
  return evaluateProviderBalanceAlert(account, options);
}

export async function checkProviderLowBalanceAlerts(options: ProviderBalanceAlertOptions = {}) {
  const accounts = await prisma.providerAccount.findMany({
    include: { provider: true },
    orderBy: [{ providerId: 'asc' }, { priority: 'asc' }],
  });

  let opened = 0;
  let notified = 0;
  let resolved = 0;

  for (const account of accounts) {
    const before = await findActiveAlert(account.id);
    const alert = await evaluateProviderBalanceAlert(account, options);

    if (!before && alert && alert.status !== 'RESOLVED') opened += 1;
    if (alert?.status === 'NOTIFIED' && before?.status !== 'NOTIFIED') notified += 1;
    if (alert?.status === 'RESOLVED') resolved += 1;
  }

  return {
    checked: accounts.length,
    opened,
    notified,
    resolved,
  };
}
