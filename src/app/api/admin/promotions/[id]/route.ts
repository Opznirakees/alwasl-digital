import type { UserLevel as DbUserLevel } from '@prisma/client';
import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapPromotion } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { updateAdminPromotionSchema } from '@/server/validation';
import type { ActiveMembershipLevel } from '@/lib/membership';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function toDbLevels(levels: ActiveMembershipLevel[]) {
  return levels.map((level) => level.toUpperCase() as DbUserLevel);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('PROMOTION_MANAGE');
    const { id } = await context.params;
    const body = updateAdminPromotionSchema.parse(await request.json().catch(() => ({})));
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');

    const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;
    const endDate = body.endDate ? new Date(body.endDate) : existing.endDate;
    if (endDate <= startDate) throw new Error('INVALID_PROMOTION_DATE_RANGE');

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        type: body.type ? (body.type === 'percentage' ? 'PERCENTAGE' : 'FIXED') : undefined,
        value: body.value,
        minPurchase: body.minPurchase,
        maxDiscount: body.maxDiscount,
        usageLimit: body.usageLimit,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isActive: body.isActive,
        applicableProducts: body.applicableGames,
        applicableLevels: body.applicableLevels ? toDbLevels(body.applicableLevels) : undefined,
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.promotion.update',
      entityType: 'promotion',
      entityId: promotion.id,
      metadata: body,
    });

    return ok({ promotion: mapPromotion(promotion) });
  } catch (error) {
    return handleApiError(error);
  }
}
