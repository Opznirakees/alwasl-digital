import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { prisma } from '@/server/prisma';
import {
  createAccessBlock,
  revokeAccessBlock,
} from '@/server/services/access-blocks';
import { updateAdminAccessBlockSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('USER_MANAGE');
    const { id } = await context.params;
    const body = updateAdminAccessBlockSchema.parse(await request.json());
    const existing = await prisma.accessBlock.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');

    const block = body.isActive
      ? await createAccessBlock(admin, {
          type: existing.type,
          value: existing.normalizedValue,
          reason: existing.reason,
          expiresAt: existing.expiresAt,
          notifyByWhatsApp: false,
        })
      : await revokeAccessBlock(admin, id);

    await recordAdminAuditLog({
      admin,
      request,
      action: body.isActive ? 'admin.access_block.reactivate' : 'admin.access_block.revoke',
      entityType: 'access_block',
      entityId: block.id,
      metadata: {
        type: block.type,
        maskedValue: block.maskedValue,
        isActive: block.isActive,
      },
    });

    return ok({ block });
  } catch (error) {
    return handleApiError(error);
  }
}
