import type { Prisma } from '@prisma/client';
import {
  getProviderAvailableBalance,
  hasProviderAccounts,
  listEligibleProviderAccounts,
  releaseProviderAccountReservation,
  reserveProviderAccountBalance,
  settleProviderAccountSuccess,
  type ProviderAccountWithProvider,
} from './provider-registry';
import {
  getWahoProvider,
  getWahoProviderForAccount,
  getWahoProviderInfo,
  type WahoProvider,
  type WahoTopupInput,
  type WahoTopupResult,
} from './waho';

export interface WahoProviderAttempt {
  provider: string;
  providerAccountId?: string;
  action: 'createWahoTopup';
  status: 'SUCCESS' | 'FAILED';
  providerOrderId?: string;
  responsePayload?: Prisma.InputJsonValue;
  error?: string;
}

export interface WahoProviderSelection {
  provider: WahoProvider;
  account?: ProviderAccountWithProvider;
}

export class WahoProviderFailoverError extends Error {
  constructor(
    message: string,
    readonly attempts: WahoProviderAttempt[]
  ) {
    super(message);
    this.name = 'WahoProviderFailoverError';
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'WAHO_PROVIDER_ERROR';
}

function toAttempt(
  account: ProviderAccountWithProvider,
  result: WahoTopupResult,
  status: WahoProviderAttempt['status'],
  error?: string
): WahoProviderAttempt {
  return {
    provider: result.providerId,
    providerAccountId: account.id,
    action: 'createWahoTopup',
    status,
    providerOrderId: result.providerOrderId,
    responsePayload: {
      providerId: result.providerId,
      providerOrderId: result.providerOrderId,
      status: result.status,
      providerAccountId: account.id,
    },
    error,
  };
}

export function isWahoProviderFailoverError(error: unknown): error is WahoProviderFailoverError {
  return error instanceof WahoProviderFailoverError;
}

export async function getWahoVerificationProvider(productSlug: string): Promise<WahoProviderSelection> {
  const candidates = await listEligibleProviderAccounts({
    service: 'WAHO_TOP_UP',
    productSlug,
    amount: 0,
    requireBalance: false,
  });

  if (candidates.length > 0) {
    return {
      provider: getWahoProviderForAccount(candidates[0]),
      account: candidates[0],
    };
  }

  const directProviderInfo = getWahoProviderInfo();
  if (directProviderInfo.isActive) {
    return {
      provider: getWahoProvider(),
    };
  }

  if (await hasProviderAccounts('WAHO_TOP_UP')) {
    throw new Error('WAHO_PROVIDER_NOT_CONFIGURED');
  }

  return {
    provider: getWahoProvider(),
  };
}

export async function createWahoTopupWithFailover(
  input: WahoTopupInput,
  options: { productSlug: string }
) {
  const amount = input.paidAmount ?? input.amount;
  const candidates = await listEligibleProviderAccounts({
    service: 'WAHO_TOP_UP',
    productSlug: options.productSlug,
    amount,
    currency: input.currency,
  });
  const attempts: WahoProviderAttempt[] = [];

  if (candidates.length === 0) {
    const providerInfo = getWahoProviderInfo();
    if (!providerInfo.isActive && await hasProviderAccounts('WAHO_TOP_UP')) {
      throw new WahoProviderFailoverError('WAHO_PROVIDER_NOT_CONFIGURED', attempts);
    }

    const provider = getWahoProvider();
    const result = await provider.createWahoTopup(input);

    return {
      result,
      attempts: [
        {
          provider: providerInfo.id,
          providerAccountId: undefined,
          action: 'createWahoTopup' as const,
          status: result.status === 'failed' ? 'FAILED' as const : 'SUCCESS' as const,
          providerOrderId: result.providerOrderId,
          responsePayload: {
            providerId: result.providerId,
            providerOrderId: result.providerOrderId,
            status: result.status,
          },
          error: result.status === 'failed' ? 'WAHO_PROVIDER_FAILED' : undefined,
        },
      ],
    };
  }

  for (const account of candidates) {
    const reserved = await reserveProviderAccountBalance(account.id, amount);
    if (!reserved) {
      attempts.push({
        provider: account.provider.code,
        providerAccountId: account.id,
        action: 'createWahoTopup',
        status: 'FAILED',
        error: 'PROVIDER_BALANCE_INSUFFICIENT',
        responsePayload: {
          availableBalance: getProviderAvailableBalance(account),
          requestedAmount: amount,
        },
      });
      continue;
    }

    try {
      const provider = getWahoProviderForAccount(account);
      const result = await provider.createWahoTopup(input);

      if (result.status === 'failed') {
        await releaseProviderAccountReservation(account.id, amount);
        attempts.push(toAttempt(account, result, 'FAILED', 'WAHO_PROVIDER_FAILED'));
        continue;
      }

      await settleProviderAccountSuccess(account.id, amount);
      const successAttempt = toAttempt(account, result, 'SUCCESS');

      return {
        result,
        account,
        attempts: [...attempts, successAttempt],
      };
    } catch (error) {
      await releaseProviderAccountReservation(account.id, amount);
      attempts.push({
        provider: account.provider.code,
        providerAccountId: account.id,
        action: 'createWahoTopup',
        status: 'FAILED',
        error: errorMessage(error),
      });
    }
  }

  throw new WahoProviderFailoverError('WAHO_PROVIDER_FAILOVER_EXHAUSTED', attempts);
}
