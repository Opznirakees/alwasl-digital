import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapBanner } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminBannerSchema } from '@/server/validation';

export const runtime = 'nodejs';

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('BANNER_MANAGE');
    const body = createAdminBannerSchema.parse(await request.json().catch(() => ({})));
    const productId = cleanOptional(body.gameId);

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!product) throw new Error('NOT_FOUND');
    }

    const banner = await prisma.banner.create({
      data: {
        title: body.title,
        titleAr: body.titleAr,
        subtitle: cleanOptional(body.subtitle),
        subtitleAr: cleanOptional(body.subtitleAr),
        image: body.image,
        link: cleanOptional(body.link),
        productId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive,
        sortOrder: body.order,
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.banner.create',
      entityType: 'banner',
      entityId: banner.id,
      metadata: {
        title: banner.title,
        productId: banner.productId,
        isActive: banner.isActive,
        startDate: banner.startDate.toISOString(),
        endDate: banner.endDate.toISOString(),
      },
    });

    return ok({ banner: mapBanner(banner) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
