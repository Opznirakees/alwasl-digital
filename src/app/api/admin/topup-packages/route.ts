import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminTopupPackageSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('PRODUCT_MANAGE');
    const body = createAdminTopupPackageSchema.parse(await request.json().catch(() => ({})));
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) throw new Error('NOT_FOUND');

    const existingAmount = await prisma.topupPackage.findFirst({
      where: { productId: body.productId, amount: body.amount },
      select: { id: true },
    });
    if (existingAmount) throw new Error('TOPUP_PACKAGE_EXISTS');

    const id = `${body.productId}-topup-${body.amount}`;
    const topupPackage = await prisma.topupPackage.create({
      data: {
        id,
        productId: body.productId,
        name: body.name ?? `${body.amount.toLocaleString('en-IQ')} ${body.currency} ${product.name}`,
        nameAr: body.nameAr ?? `${product.nameAr} بقيمة ${body.amount.toLocaleString('en-IQ')} د.ع`,
        amount: body.amount,
        unit: body.unit,
        unitAr: body.unitAr,
        basePrice: body.basePrice,
        salePrice: body.salePrice ?? undefined,
        currency: body.currency,
        inStock: body.inStock,
        isPopular: body.isPopular,
        sortOrder: body.sortOrder ?? (await prisma.topupPackage.count({ where: { productId: body.productId } })),
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.topup_package.create',
      entityType: 'topup_package',
      entityId: topupPackage.id,
      metadata: {
        productId: body.productId,
        amount: body.amount,
        basePrice: body.basePrice,
        inStock: body.inStock,
      },
    });

    const updatedProduct = await prisma.product.findUniqueOrThrow({
      where: { id: body.productId },
      include: { packages: { orderBy: { sortOrder: 'asc' } } },
    });

    return ok({ product: mapProduct(updatedProduct), package: topupPackage }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
