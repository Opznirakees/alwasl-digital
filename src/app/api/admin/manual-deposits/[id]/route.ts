import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapManualDeposit } from '@/server/mappers';
import { reviewManualDeposit } from '@/server/services/manual-deposits';
import { reviewManualDepositSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('MANUAL_DEPOSIT_REVIEW');
    const { id } = await context.params;
    const body = reviewManualDepositSchema.parse(await request.json().catch(() => ({})));
    const manualDeposit = await reviewManualDeposit(admin, id, {
      status: body.status,
      reason: body.reason,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.manual_deposit.review',
      entityType: 'manual_deposit',
      entityId: manualDeposit.id,
      metadata: {
        status: manualDeposit.status,
        amount: manualDeposit.amount,
        currency: manualDeposit.currency,
        transactionId: manualDeposit.transactionId,
        userId: manualDeposit.userId,
        reason: manualDeposit.rejectionReason,
      },
    });

    return ok({ manualDeposit: mapManualDeposit(manualDeposit) });
  } catch (error) {
    return handleApiError(error);
  }
}
