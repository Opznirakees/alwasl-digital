import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapProviderAccount } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { evaluateProviderBalanceAlertByAccountId } from '@/server/services/provider-balance-alerts';
import { updateAdminProviderAccountSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('PROVIDER_MANAGE');
    const { id } = await context.params;
    const body = updateAdminProviderAccountSchema.parse(await request.json().catch(() => ({})));

    const providerAccount = await prisma.providerAccount.update({
      where: { id },
      data: {
        name: body.name,
        apiEndpoint: body.apiEndpoint || undefined,
        isActive: body.isActive,
        priority: body.priority,
        fallbackEnabled: body.fallbackEnabled,
        balance: body.balance,
        minBalance: body.minBalance,
        lowBalanceThreshold: body.lowBalanceThreshold,
        status: body.status ?? (body.isActive === false ? 'OFFLINE' : undefined),
      },
      include: { provider: true },
    });

    await evaluateProviderBalanceAlertByAccountId(providerAccount.id);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.provider_account.update',
      entityType: 'provider_account',
      entityId: providerAccount.id,
      metadata: body,
    });

    return ok({ provider: mapProviderAccount(providerAccount) });
  } catch (error) {
    return handleApiError(error);
  }
}
