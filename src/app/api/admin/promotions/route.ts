import type { UserLevel as DbUserLevel } from '@prisma/client';
import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapPromotion } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminPromotionSchema } from '@/server/validation';
import type { ActiveMembershipLevel } from '@/lib/membership';

export const runtime = 'nodejs';

function toDbLevels(levels: ActiveMembershipLevel[]) {
  return levels.map((level) => level.toUpperCase() as DbUserLevel);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('PROMOTION_MANAGE');
    const body = createAdminPromotionSchema.parse(await request.json().catch(() => ({})));
    const existing = await prisma.promotion.findUnique({ where: { code: body.code }, select: { id: true } });
    if (existing) throw new Error('PROMOTION_CODE_EXISTS');

    const promotion = await prisma.promotion.create({
      data: {
        code: body.code,
        type: body.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        value: body.value,
        minPurchase: body.minPurchase,
        maxDiscount: body.maxDiscount ?? undefined,
        usageLimit: body.usageLimit,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive,
        applicableProducts: body.applicableGames,
        applicableLevels: toDbLevels(body.applicableLevels),
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.promotion.create',
      entityType: 'promotion',
      entityId: promotion.id,
      metadata: {
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
        isActive: promotion.isActive,
      },
    });

    return ok({ promotion: mapPromotion(promotion) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
