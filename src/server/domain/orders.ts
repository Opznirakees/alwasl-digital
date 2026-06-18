import type { TopupPackage, User } from '@prisma/client';

export function calculateOrderPricing(pkg: Pick<TopupPackage, 'basePrice' | 'salePrice'>, user: Pick<User, 'discountPercentage'>) {
  const unitPrice = pkg.salePrice ?? pkg.basePrice;
  const totalPrice = unitPrice;
  const discount = Math.round((totalPrice * user.discountPercentage) / 100);
  const finalPrice = Math.max(0, totalPrice - discount);

  return {
    quantity: 1,
    unitPrice,
    totalPrice,
    discount,
    finalPrice,
  };
}

export function createOrderId(now = new Date(), random = Math.random()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${date}-${Math.floor(1000 + random * 9000)}`;
}
