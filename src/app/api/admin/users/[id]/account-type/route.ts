import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapUser } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { adminUserAccountTypeSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('USER_MANAGE');
    const { id } = await context.params;
    const body = adminUserAccountTypeSchema.parse(await request.json().catch(() => ({})));
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) throw new Error('NOT_FOUND');
    if (target.role !== 'USER' && body.accountType === 'DISTRIBUTOR') throw new Error('FORBIDDEN');

    const user = await prisma.user.update({
      where: { id },
      data: { accountType: body.accountType },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.user.account_type.update',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        phone: user.phone,
        accountType: user.accountType,
      },
    });

    return ok({ user: mapUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
