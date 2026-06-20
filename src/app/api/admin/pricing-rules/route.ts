import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCustomPricingRule } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminCustomPricingRuleSchema } from '@/server/validation';

export const runtime = 'nodejs';

const customPricingRuleInclude = {
  product: { select: { id: true, name: true } },
  package: { select: { id: true, name: true, productId: true } },
  user: { select: { id: true, phone: true } },
};

async function assertPricingRuleReferences(input: {
  productId?: string | null;
  packageId?: string | null;
  userId?: string | null;
  targetType: string;
}) {
  const [product, topupPackage, user] = await Promise.all([
    input.productId ? prisma.product.findUnique({ where: { id: input.productId }, select: { id: true } }) : null,
    input.packageId ? prisma.topupPackage.findUnique({ where: { id: input.packageId }, select: { id: true, productId: true } }) : null,
    input.userId ? prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } }) : null,
  ]);

  if (input.productId && !product) throw new Error('NOT_FOUND');
  if (input.packageId && !topupPackage) throw new Error('NOT_FOUND');
  if (input.userId && !user) throw new Error('NOT_FOUND');
  if (input.productId && topupPackage && topupPackage.productId !== input.productId) {
    throw new Error('PRICING_RULE_SCOPE_MISMATCH');
  }
  if (input.targetType === 'USER' && !input.userId) throw new Error('PRICING_RULE_USER_REQUIRED');
  if (input.targetType !== 'USER' && input.userId) throw new Error('PRICING_RULE_USER_NOT_ALLOWED');
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('PRICING_MANAGE');
    const rules = await prisma.customPricingRule.findMany({
      include: customPricingRuleInclude,
      orderBy: [{ isActive: 'desc' }, { priority: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.pricing_rule.list',
      entityType: 'custom_pricing_rule',
      metadata: { returnedCount: rules.length },
    });

    return ok({ customPricingRules: rules.map(mapCustomPricingRule) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('PRICING_MANAGE');
    const body = createAdminCustomPricingRuleSchema.parse(await request.json().catch(() => ({})));
    await assertPricingRuleReferences(body);

    const rule = await prisma.customPricingRule.create({
      data: {
        name: body.name,
        targetType: body.targetType,
        priceType: body.priceType,
        value: body.value,
        productId: body.productId ?? undefined,
        packageId: body.packageId ?? undefined,
        userId: body.targetType === 'USER' ? body.userId ?? undefined : undefined,
        priority: body.priority,
        isActive: body.isActive,
        applyMembershipDiscount: body.applyMembershipDiscount,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        createdByAdminId: admin.id,
      },
      include: customPricingRuleInclude,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.pricing_rule.create',
      entityType: 'custom_pricing_rule',
      entityId: rule.id,
      metadata: {
        targetType: rule.targetType,
        priceType: rule.priceType,
        value: rule.value,
        productId: rule.productId,
        packageId: rule.packageId,
        userId: rule.userId,
      },
    });

    return ok({ customPricingRule: mapCustomPricingRule(rule) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
