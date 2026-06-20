import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { updateAdminProductSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('PRODUCT_MANAGE');
    const { id } = await context.params;
    const body = updateAdminProductSchema.parse(await request.json().catch(() => ({})));

    const product = await prisma.product.update({
      where: { id },
      data: body,
      include: { packages: { orderBy: { sortOrder: 'asc' } } },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.product.update',
      entityType: 'product',
      entityId: product.id,
      metadata: body,
    });

    return ok({ product: mapProduct(product) });
  } catch (error) {
    return handleApiError(error);
  }
}
