ALTER TABLE "users"
ADD CONSTRAINT "users_wallet_balance_non_negative" CHECK ("walletBalance" >= 0),
ADD CONSTRAINT "users_total_spent_non_negative" CHECK ("totalSpent" >= 0),
ADD CONSTRAINT "users_discount_percentage_range" CHECK ("discountPercentage" >= 0 AND "discountPercentage" <= 100);

ALTER TABLE "topup_packages"
ADD CONSTRAINT "topup_packages_amount_positive" CHECK ("amount" > 0),
ADD CONSTRAINT "topup_packages_base_price_non_negative" CHECK ("basePrice" >= 0),
ADD CONSTRAINT "topup_packages_sale_price_non_negative" CHECK ("salePrice" IS NULL OR "salePrice" >= 0),
ADD CONSTRAINT "topup_packages_sale_price_not_above_base_price" CHECK ("salePrice" IS NULL OR "salePrice" <= "basePrice");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_quantity_positive" CHECK ("quantity" > 0),
ADD CONSTRAINT "orders_unit_price_non_negative" CHECK ("unitPrice" >= 0),
ADD CONSTRAINT "orders_total_price_non_negative" CHECK ("totalPrice" >= 0),
ADD CONSTRAINT "orders_discount_non_negative" CHECK ("discount" >= 0),
ADD CONSTRAINT "orders_final_price_non_negative" CHECK ("finalPrice" >= 0),
ADD CONSTRAINT "orders_discount_not_above_total_price" CHECK ("discount" <= "totalPrice"),
ADD CONSTRAINT "orders_final_price_matches_total_minus_discount" CHECK ("finalPrice" = "totalPrice" - "discount");

ALTER TABLE "payment_attempts"
ADD CONSTRAINT "payment_attempts_amount_non_negative" CHECK ("amount" >= 0);

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_balance_non_negative" CHECK ("balance" >= 0);
