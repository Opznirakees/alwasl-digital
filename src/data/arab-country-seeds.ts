import type { Country } from '@/types';
import { countryCatalog } from './country-catalog';

// Admin-editable IQD conversion snapshot from 2026-08-21. Checkout remains denominated in IQD.
const iqdRates: Record<string, number> = {
  AED: 0.002802,
  BHD: 0.000287,
  DJF: 0.135616,
  DZD: 0.101398,
  EGP: 0.038641,
  ILS: 0.002288,
  IQD: 1,
  JOD: 0.000541,
  KMF: 0.321393,
  KWD: 0.000234,
  LBP: 68.295931,
  LYD: 0.004853,
  MAD: 0.007073,
  MRU: 0.030585,
  OMR: 0.000293,
  QAR: 0.002778,
  SAR: 0.002862,
  SDG: 0.390476,
  SOS: 0.435945,
  SYP: 0.093099,
  TND: 0.002217,
  USD: 0.000763,
  YER: 0.180884,
};

const arabCountryIds = new Set([
  'ae', 'bh', 'dj', 'dz', 'eg', 'iq', 'jo', 'km', 'kw', 'lb', 'ly',
  'ma', 'mr', 'om', 'ps', 'qa', 'sa', 'sd', 'so', 'sy', 'tn', 'ye',
]);

export const arabCountrySeeds: Country[] = countryCatalog
  .filter((country) => arabCountryIds.has(country.id))
  .map((country) => {
    const rate = iqdRates[country.currencyCode] ?? 0;
    return {
      id: country.id,
      code: country.code,
      name: country.name,
      nameAr: country.nameAr,
      nameZh: country.nameZh,
      flag: country.flag,
      phoneCode: country.phoneCode,
      currency: country.currencyCode,
      currencySymbol: country.currencySymbol,
      currencyName: country.currencyName,
      decimalPlaces: country.decimalPlaces,
      exchangeRate: rate,
      exchangeRateBase: 'IQD',
      primaryPriceCurrency: country.currencyCode === 'IQD' ? 'IQD' : 'LOCAL',
      showPricesInIqd: country.currencyCode === 'IQD',
      showPricesInUsd: false,
      showPricesInLocal: true,
      priceCurrencies: [{
        code: country.currencyCode,
        name: country.currencyName,
        symbol: country.currencySymbol,
        decimalPlaces: country.decimalPlaces,
        rate,
        isPrimary: true,
        isAvailable: rate > 0,
      }],
      isActive: true,
    };
  });

// Phone login remains global. Countries outside the Arab-region pricing scope use
// USD until an administrator adds a local IQD exchange rate and enables it.
export const allCountrySeeds: Country[] = countryCatalog.map((country) => {
  const rate = iqdRates[country.currencyCode] ?? 0;
  const hasManagedLocalRate = rate > 0;
  const primaryPriceCurrency = country.currencyCode === 'IQD'
    ? 'IQD'
    : hasManagedLocalRate
      ? 'LOCAL'
      : 'USD';

  return {
    id: country.id,
    code: country.code,
    name: country.name,
    nameAr: country.nameAr,
    nameZh: country.nameZh,
    flag: country.flag,
    phoneCode: country.phoneCode,
    currency: country.currencyCode,
    currencySymbol: country.currencySymbol,
    currencyName: country.currencyName,
    decimalPlaces: country.decimalPlaces,
    exchangeRate: rate,
    exchangeRateBase: 'IQD',
    primaryPriceCurrency,
    showPricesInIqd: country.currencyCode === 'IQD',
    showPricesInUsd: !hasManagedLocalRate,
    showPricesInLocal: hasManagedLocalRate,
    priceCurrencies: hasManagedLocalRate ? [{
      code: country.currencyCode,
      name: country.currencyName,
      symbol: country.currencySymbol,
      decimalPlaces: country.decimalPlaces,
      rate,
      isPrimary: true,
      isAvailable: true,
    }] : [{
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalPlaces: 2,
      rate: iqdRates.USD,
      isPrimary: true,
      isAvailable: true,
    }],
    isActive: true,
  };
});

export const arabCurrencyRates = iqdRates;
