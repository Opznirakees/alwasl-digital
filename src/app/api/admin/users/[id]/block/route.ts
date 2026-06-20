import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapUser } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { adminUserBlockSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('USER_MANAGE');
    const { id } = await context.params;
    const body = adminUserBlockSchema.parse(await request.json().catch(() => ({})));
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) throw new Error('NOT_FOUND');
    if (target.role !== 'USER' && body.isBlocked) throw new Error('FORBIDDEN');

    const now = new Date();
    const user = await prisma.user.update({
      where: { id },
      data: body.isBlocked
        ? {
            isBlocked: true,
            blockedReason: body.reason,
            blockedAt: now,
            blockedByAdminId: admin.id,
          }
        : {
            isBlocked: false,
            blockedReason: null,
            blockedAt: null,
            blockedByAdminId: null,
          },
    });

    if (body.isBlocked) {
      await prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now },
      });
    }

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.user.block.update',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        phone: user.phone,
        isBlocked: user.isBlocked,
        reason: user.blockedReason,
      },
    });

    return ok({ user: mapUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
