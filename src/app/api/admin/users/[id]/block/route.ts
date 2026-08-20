import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapUser } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { normalizeAccessBlockValue } from '@/server/domain/access-blocks';
import {
  createAccessBlock,
  revokeAccessBlock,
} from '@/server/services/access-blocks';
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

    if (body.isBlocked) {
      await createAccessBlock(admin, {
        type: 'WHATSAPP',
        value: target.phone,
        reason: body.reason ?? 'Access blocked by administration',
        notifyByWhatsApp: body.notifyByWhatsApp,
      });
    } else {
      const normalizedValue = normalizeAccessBlockValue('WHATSAPP', target.phone);
      const block = await prisma.accessBlock.findUnique({
        where: {
          type_normalizedValue: {
            type: 'WHATSAPP',
            normalizedValue,
          },
        },
      });

      if (block) {
        await revokeAccessBlock(admin, block.id);
      } else {
        await prisma.user.update({
          where: { id },
          data: {
            isBlocked: false,
            blockedReason: null,
            blockedAt: null,
            blockedByAdminId: null,
          },
        });
      }
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id } });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.user.block.update',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        phoneSuffix: user.phone.replace(/\D/g, '').slice(-4),
        isBlocked: user.isBlocked,
        reason: user.blockedReason,
        notificationRequested: body.notifyByWhatsApp,
      },
    });

    return ok({ user: mapUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
