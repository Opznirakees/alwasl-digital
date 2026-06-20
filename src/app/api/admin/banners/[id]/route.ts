import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapBanner } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { updateAdminBannerSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function cleanOptional(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('BANNER_MANAGE');
    const { id } = await context.params;
    const body = updateAdminBannerSchema.parse(await request.json().catch(() => ({})));
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');

    const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;
    const endDate = body.endDate ? new Date(body.endDate) : existing.endDate;
    if (endDate <= startDate) throw new Error('INVALID_BANNER_DATE_RANGE');

    const productId = cleanOptional(body.gameId);
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!product) throw new Error('NOT_FOUND');
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title: body.title,
        titleAr: body.titleAr,
        subtitle: cleanOptional(body.subtitle),
        subtitleAr: cleanOptional(body.subtitleAr),
        image: body.image,
        link: cleanOptional(body.link),
        productId,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isActive: body.isActive,
        sortOrder: body.order,
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.banner.update',
      entityType: 'banner',
      entityId: banner.id,
      metadata: body,
    });

    return ok({ banner: mapBanner(banner) });
  } catch (error) {
    return handleApiError(error);
  }
}
