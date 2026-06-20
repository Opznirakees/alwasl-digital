import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { prisma } from '@/server/prisma';
import { updateAdminTopupPackageSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('PRODUCT_MANAGE');
    const { id } = await context.params;
    const body = updateAdminTopupPackageSchema.parse(await request.json().catch(() => ({})));

    const topupPackage = await prisma.topupPackage.update({
      where: { id },
      data: {
        basePrice: body.basePrice,
        salePrice: body.salePrice,
        inStock: body.inStock,
        isPopular: body.isPopular,
        sortOrder: body.sortOrder,
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.topup_package.update',
      entityType: 'topup_package',
      entityId: topupPackage.id,
      metadata: body,
    });

    return ok({ package: topupPackage });
  } catch (error) {
    return handleApiError(error);
  }
}
