export type PricingAccountType = 'CUSTOMER' | 'DISTRIBUTOR';
export type PricingRuleTargetType = 'ALL' | 'CUSTOMER' | 'DISTRIBUTOR' | 'USER';
export type PricingRulePriceType = 'FIXED_PRICE' | 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT';

export interface CustomPricingRuleForPricing {
  id: string;
  targetType: PricingRuleTargetType;
  priceType: PricingRulePriceType;
  value: number;
  productId?: string | null;
  packageId?: string | null;
  userId?: string | null;
  priority: number;
  isActive: boolean;
  applyMembershipDiscount: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface CustomPricingContext {
  userId: string;
  accountType: PricingAccountType;
  productId: string;
  packageId: string;
}

export interface AppliedCustomPricing {
  unitPrice: number;
  discount: number;
  finalPrice: number;
  customPricingRuleId?: string;
}

function isWithinActiveWindow(rule: CustomPricingRuleForPricing, now: Date) {
  if (!rule.isActive) return false;
  if (rule.startDate && rule.startDate > now) return false;
  if (rule.endDate && rule.endDate <= now) return false;
  return true;
}

function targetMatches(rule: CustomPricingRuleForPricing, context: CustomPricingContext) {
  if (rule.targetType === 'ALL') return true;
  if (rule.targetType === 'CUSTOMER') return context.accountType === 'CUSTOMER';
  if (rule.targetType === 'DISTRIBUTOR') return context.accountType === 'DISTRIBUTOR';
  return rule.userId === context.userId;
}

function scopeMatches(rule: CustomPricingRuleForPricing, context: CustomPricingContext) {
  if (rule.productId && rule.productId !== context.productId) return false;
  if (rule.packageId && rule.packageId !== context.packageId) return false;
  return true;
}

function specificityScore(rule: CustomPricingRuleForPricing) {
  const targetScore = rule.targetType === 'USER' ? 100 : rule.targetType === 'ALL' ? 0 : 50;
  const packageScore = rule.packageId ? 20 : 0;
  const productScore = rule.productId ? 10 : 0;
  return targetScore + packageScore + productScore;
}

export function selectCustomPricingRule(
  rules: CustomPricingRuleForPricing[],
  context: CustomPricingContext,
  now = new Date()
) {
  return rules
    .filter((rule) => (
      isWithinActiveWindow(rule, now) &&
      targetMatches(rule, context) &&
      scopeMatches(rule, context)
    ))
    .sort((a, b) => (
      a.priority - b.priority ||
      specificityScore(b) - specificityScore(a) ||
      a.id.localeCompare(b.id)
    ))[0] ?? null;
}

function clampDiscount(discount: number, unitPrice: number) {
  return Math.min(Math.max(0, Math.round(discount)), unitPrice);
}

export function applyCustomPricingRule(
  baseUnitPrice: number,
  rule: CustomPricingRuleForPricing | null | undefined,
  membershipDiscountPercentage: number
): AppliedCustomPricing {
  const normalizedUnitPrice = Math.max(0, Math.round(baseUnitPrice));
  let unitPrice = normalizedUnitPrice;
  let customDiscount = 0;

  if (rule) {
    if (rule.priceType === 'FIXED_PRICE') {
      unitPrice = Math.max(0, Math.round(rule.value));
    } else if (rule.priceType === 'PERCENTAGE_DISCOUNT') {
      customDiscount = clampDiscount((unitPrice * rule.value) / 100, unitPrice);
    } else {
      customDiscount = clampDiscount(rule.value, unitPrice);
    }
  }

  const priceAfterCustomDiscount = Math.max(0, unitPrice - customDiscount);
  const shouldApplyMembership = !rule || rule.applyMembershipDiscount;
  const membershipDiscount = shouldApplyMembership
    ? clampDiscount((priceAfterCustomDiscount * membershipDiscountPercentage) / 100, priceAfterCustomDiscount)
    : 0;
  const discount = clampDiscount(customDiscount + membershipDiscount, unitPrice);
  const finalPrice = Math.max(0, unitPrice - discount);

  return {
    unitPrice,
    discount,
    finalPrice,
    ...(rule ? { customPricingRuleId: rule.id } : {}),
  };
}
