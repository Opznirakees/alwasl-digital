import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapProviderAccount } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { evaluateProviderBalanceAlertByAccountId } from '@/server/services/provider-balance-alerts';
import { createAdminProviderAccountSchema } from '@/server/validation';

export const runtime = 'nodejs';

function providerCodeFromId(providerId: string) {
  return providerId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'waho-top-up';
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('PROVIDER_MANAGE');
    const body = createAdminProviderAccountSchema.parse(await request.json().catch(() => ({})));

    const provider = await prisma.provider.upsert({
      where: { id: body.providerId },
      update: {
        isActive: true,
        supportedProducts: body.supportedProducts,
      },
      create: {
        id: body.providerId,
        code: providerCodeFromId(body.providerId),
        name: 'WAHO Top-Up Provider Network',
        service: 'WAHO_TOP_UP',
        isActive: true,
        priority: 1,
        supportedProducts: body.supportedProducts,
      },
    });

    const providerAccount = await prisma.providerAccount.create({
      data: {
        id: `provider-account-${randomUUID()}`,
        providerId: provider.id,
        name: body.name,
        type: body.type,
        apiEndpoint: body.apiEndpoint || undefined,
        isActive: body.isActive,
        priority: body.priority,
        fallbackEnabled: body.fallbackEnabled,
        balance: body.balance,
        reservedBalance: 0,
        minBalance: body.minBalance,
        lowBalanceThreshold: body.lowBalanceThreshold,
        currency: body.currency,
        dailyUsed: 0,
        successRate: body.isActive ? 100 : 0,
        avgResponseTimeMs: 0,
        status: body.isActive ? 'DEGRADED' : 'OFFLINE',
        failureCount: 0,
        supportedProducts: body.supportedProducts,
      },
      include: { provider: true },
    });

    await evaluateProviderBalanceAlertByAccountId(providerAccount.id);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.provider_account.create',
      entityType: 'provider_account',
      entityId: providerAccount.id,
      metadata: {
        providerId: provider.id,
        type: body.type,
        isActive: body.isActive,
        priority: body.priority,
        balance: body.balance,
        lowBalanceThreshold: body.lowBalanceThreshold,
      },
    });

    return ok({ provider: mapProviderAccount(providerAccount) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
