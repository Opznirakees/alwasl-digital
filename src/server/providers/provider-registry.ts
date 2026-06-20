import type { Provider, ProviderAccount, ProviderService } from '@prisma/client';
import { prisma } from '../prisma';
import { evaluateProviderBalanceAlertByAccountId } from '../services/provider-balance-alerts';

export type ProviderAccountWithProvider = ProviderAccount & {
  provider: Provider;
};

interface ProviderSelectionInput {
  service?: ProviderService;
  productSlug: string;
  amount: number;
  currency?: string;
  requireBalance?: boolean;
}

function supportsProduct(account: ProviderAccountWithProvider, productSlug: string) {
  return (
    account.supportedProducts.includes(productSlug) ||
    account.provider.supportedProducts.includes(productSlug)
  );
}

export function getProviderAvailableBalance(account: Pick<ProviderAccount, 'balance' | 'reservedBalance' | 'minBalance'>) {
  return Math.max(account.balance - account.reservedBalance - account.minBalance, 0);
}

export function isProviderAccountEligible(account: ProviderAccountWithProvider, input: ProviderSelectionInput) {
  if (!account.provider.isActive || !account.isActive || !account.fallbackEnabled) return false;
  if (account.status === 'OFFLINE') return false;
  if (!supportsProduct(account, input.productSlug)) return false;
  if (input.currency && account.currency !== input.currency) return false;

  const requireBalance = input.requireBalance ?? input.amount > 0;
  if (!requireBalance) return true;

  if (account.dailyLimit !== null && account.dailyUsed + input.amount > account.dailyLimit) return false;
  return getProviderAvailableBalance(account) >= input.amount;
}

export function selectProviderAccounts(
  candidates: ProviderAccountWithProvider[],
  input: ProviderSelectionInput
) {
  return candidates
    .filter((account) => isProviderAccountEligible(account, input))
    .sort((first, second) => {
      const providerPriority = first.provider.priority - second.provider.priority;
      if (providerPriority !== 0) return providerPriority;

      const accountPriority = first.priority - second.priority;
      if (accountPriority !== 0) return accountPriority;

      const statusRank = (status: ProviderAccount['status']) => (status === 'ONLINE' ? 0 : 1);
      const statusScore = statusRank(first.status) - statusRank(second.status);
      if (statusScore !== 0) return statusScore;

      const successScore = second.successRate - first.successRate;
      if (successScore !== 0) return successScore;

      return getProviderAvailableBalance(second) - getProviderAvailableBalance(first);
    });
}

export async function hasProviderAccounts(service: ProviderService) {
  const count = await prisma.providerAccount.count({
    where: {
      provider: { service },
    },
  });

  return count > 0;
}

export async function listProviderCandidates(input: ProviderSelectionInput) {
  return prisma.providerAccount.findMany({
    where: {
      provider: {
        service: input.service ?? 'WAHO_TOP_UP',
      },
    },
    include: {
      provider: true,
    },
  });
}

export async function listEligibleProviderAccounts(input: ProviderSelectionInput) {
  const candidates = await listProviderCandidates(input);
  return selectProviderAccounts(candidates, input);
}

export async function reserveProviderAccountBalance(accountId: string, amount: number) {
  if (amount <= 0) return true;

  const updated = await prisma.$executeRaw`
    UPDATE "provider_accounts"
    SET "reservedBalance" = "reservedBalance" + ${amount}, "updatedAt" = NOW()
    WHERE "id" = ${accountId}
      AND "isActive" = true
      AND "fallbackEnabled" = true
      AND "status" <> 'OFFLINE'::"ProviderAccountStatus"
      AND ("balance" - "reservedBalance" - "minBalance") >= ${amount}
      AND ("dailyLimit" IS NULL OR ("dailyUsed" + ${amount}) <= "dailyLimit")
  `;

  return updated === 1;
}

export async function settleProviderAccountSuccess(accountId: string, amount: number) {
  if (amount <= 0) return;

  const updated = await prisma.$executeRaw`
    UPDATE "provider_accounts"
    SET
      "reservedBalance" = GREATEST("reservedBalance" - ${amount}, 0),
      "balance" = "balance" - ${amount},
      "dailyUsed" = "dailyUsed" + ${amount},
      "failureCount" = 0,
      "status" = 'ONLINE'::"ProviderAccountStatus",
      "lastHealthCheck" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" = ${accountId}
      AND "balance" >= ${amount}
  `;

  if (updated === 1) {
    await evaluateProviderBalanceAlertByAccountId(accountId);
  }
}

export async function releaseProviderAccountReservation(accountId: string, amount: number) {
  if (amount <= 0) return;

  await prisma.$executeRaw`
    UPDATE "provider_accounts"
    SET
      "reservedBalance" = GREATEST("reservedBalance" - ${amount}, 0),
      "failureCount" = "failureCount" + 1,
      "status" = 'DEGRADED'::"ProviderAccountStatus",
      "lastFailureAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" = ${accountId}
  `;
}
