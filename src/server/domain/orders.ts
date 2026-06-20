import type { TopupPackage, User } from '@prisma/client';
import { applyCustomPricingRule, type CustomPricingRuleForPricing } from './custom-pricing';

export function calculateOrderPricing(
  pkg: Pick<TopupPackage, 'basePrice' | 'salePrice'>,
  user: Pick<User, 'discountPercentage'> & { customPricingRule?: CustomPricingRuleForPricing | null }
) {
  const baseUnitPrice = pkg.salePrice ?? pkg.basePrice;
  const appliedPricing = applyCustomPricingRule(baseUnitPrice, user.customPricingRule, user.discountPercentage);

  return {
    quantity: 1,
    unitPrice: appliedPricing.unitPrice,
    totalPrice: appliedPricing.unitPrice,
    discount: appliedPricing.discount,
    finalPrice: appliedPricing.finalPrice,
    ...(appliedPricing.customPricingRuleId ? { customPricingRuleId: appliedPricing.customPricingRuleId } : {}),
  };
}

export function createOrderId(now = new Date(), random = Math.random()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${date}-${Math.floor(1000 + random * 9000)}`;
}
