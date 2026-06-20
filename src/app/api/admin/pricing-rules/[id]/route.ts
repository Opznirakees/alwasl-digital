import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCustomPricingRule } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { updateAdminCustomPricingRuleSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const customPricingRuleInclude = {
  product: { select: { id: true, name: true } },
  package: { select: { id: true, name: true, productId: true } },
  user: { select: { id: true, phone: true } },
};

async function assertPricingRuleState(input: {
  productId?: string | null;
  packageId?: string | null;
  userId?: string | null;
  targetType: string;
  priceType: string;
  value: number;
  startDate?: Date | null;
  endDate?: Date | null;
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
  if (input.priceType === 'PERCENTAGE_DISCOUNT' && input.value > 100) throw new Error('INVALID_PRICING_RULE_VALUE');
  if (input.startDate && input.endDate && input.endDate <= input.startDate) throw new Error('INVALID_PRICING_RULE_DATE_RANGE');
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('PRICING_MANAGE');
    const { id } = await context.params;
    const body = updateAdminCustomPricingRuleSchema.parse(await request.json().catch(() => ({})));
    const existing = await prisma.customPricingRule.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');

    const nextState = {
      productId: body.productId !== undefined ? body.productId : existing.productId,
      packageId: body.packageId !== undefined ? body.packageId : existing.packageId,
      userId: body.userId !== undefined ? body.userId : existing.userId,
      targetType: body.targetType ?? existing.targetType,
      priceType: body.priceType ?? existing.priceType,
      value: body.value ?? existing.value,
      startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : existing.startDate,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : existing.endDate,
    };
    if (nextState.targetType !== 'USER') nextState.userId = null;

    await assertPricingRuleState(nextState);

    const rule = await prisma.customPricingRule.update({
      where: { id },
      data: {
        name: body.name,
        targetType: body.targetType,
        priceType: body.priceType,
        value: body.value,
        productId: body.productId === undefined ? undefined : body.productId,
        packageId: body.packageId === undefined ? undefined : body.packageId,
        userId: nextState.targetType === 'USER'
          ? (body.userId === undefined ? undefined : body.userId)
          : null,
        priority: body.priority,
        isActive: body.isActive,
        applyMembershipDiscount: body.applyMembershipDiscount,
        startDate: body.startDate === undefined ? undefined : nextState.startDate,
        endDate: body.endDate === undefined ? undefined : nextState.endDate,
      },
      include: customPricingRuleInclude,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.pricing_rule.update',
      entityType: 'custom_pricing_rule',
      entityId: rule.id,
      metadata: body,
    });

    return ok({ customPricingRule: mapCustomPricingRule(rule) });
  } catch (error) {
    return handleApiError(error);
  }
}
