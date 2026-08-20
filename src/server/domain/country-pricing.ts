export type PrimaryPriceCurrency = 'IQD' | 'USD' | 'LOCAL';

interface CountryPricePolicy {
  localCurrencyCode: string;
  primaryPriceCurrency: PrimaryPriceCurrency;
  showPricesInIqd: boolean;
  showPricesInUsd: boolean;
  showPricesInLocal: boolean;
}

function resolvePrimaryCode(policy: CountryPricePolicy) {
  if (policy.primaryPriceCurrency === 'LOCAL') return policy.localCurrencyCode;
  return policy.primaryPriceCurrency;
}

export function assertCountryPrimaryRate(
  policy: CountryPricePolicy,
  ratesByCurrency: Record<string, number>
) {
  const primaryCode = resolvePrimaryCode(policy);
  if (primaryCode === 'IQD') return;

  const rate = ratesByCurrency[primaryCode];
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('PRIMARY_PRICE_RATE_REQUIRED');
  }
}

export function assertCountryPricePolicy(policy: CountryPricePolicy) {
  const visibleCodes = new Set<string>();
  if (policy.showPricesInIqd) visibleCodes.add('IQD');
  if (policy.showPricesInUsd) visibleCodes.add('USD');
  if (policy.showPricesInLocal) visibleCodes.add(policy.localCurrencyCode);
  if (!visibleCodes.size) throw new Error('PRICE_CURRENCY_REQUIRED');
  if (!visibleCodes.has(resolvePrimaryCode(policy))) {
    throw new Error('PRIMARY_PRICE_CURRENCY_HIDDEN');
  }
}

export function resolveCountryPriceCurrencies(policy: CountryPricePolicy) {
  const selected = new Set<string>();
  if (policy.showPricesInIqd) selected.add('IQD');
  if (policy.showPricesInUsd) selected.add('USD');
  if (policy.showPricesInLocal) selected.add(policy.localCurrencyCode);

  if (selected.size === 0) selected.add(resolvePrimaryCode(policy));

  const primary = resolvePrimaryCode(policy);
  if (!selected.has(primary)) selected.add(primary);

  return [primary, ...[...selected].filter((code) => code !== primary)];
}

export function convertIqdPrice(
  amountIqd: number,
  currencyCode: string,
  ratesByCurrency: Record<string, number>
) {
  if (currencyCode === 'IQD') return amountIqd;
  const rate = ratesByCurrency[currencyCode];
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return amountIqd * rate;
}
