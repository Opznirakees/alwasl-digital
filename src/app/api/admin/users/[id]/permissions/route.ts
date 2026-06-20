import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapUser } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { adminUserPermissionsSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('USER_MANAGE');
    const { id } = await context.params;
    const body = adminUserPermissionsSchema.parse(await request.json().catch(() => ({})));
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) throw new Error('NOT_FOUND');
    if (target.id === admin.id && body.role !== 'ADMIN') throw new Error('FORBIDDEN');
    if (body.role === 'ADMIN' && admin.role !== 'ADMIN') throw new Error('FORBIDDEN');
    if (target.role === 'ADMIN' && admin.role !== 'ADMIN') throw new Error('FORBIDDEN');

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: body.role,
        staffRole: body.role === 'STAFF' ? body.staffRole : null,
        staffPermissions: body.role === 'STAFF' ? body.staffPermissions : [],
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.user.permissions.update',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        phone: user.phone,
        previousRole: target.role,
        role: user.role,
        staffRole: user.staffRole,
        staffPermissions: user.staffPermissions,
      },
    });

    return ok({ user: mapUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
