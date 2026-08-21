import worldCountries from 'world-countries';
import { resolveCountryDialCode } from './dial-code';

export interface CountryCatalogItem {
  id: string;
  code: string;
  numericCode?: string;
  name: string;
  nameAr: string;
  nameZh: string;
  flag: string;
  phoneCode: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  decimalPlaces: number;
}

function resolveDecimalPlaces(currencyCode: string) {
  if (currencyCode === 'IQD') return 0;
  if (['BHD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'].includes(currencyCode)) return 3;
  return 2;
}

const preferredCountryCurrencies: Record<string, string> = {
  // Palestine commonly prices consumer services in ILS. `world-countries`
  // lists several circulating currencies and otherwise selects EGP first.
  PS: 'ILS',
};

export const countryCatalog: CountryCatalogItem[] = worldCountries
  .flatMap((country) => {
    const currencies = country.currencies ?? {};
    const preferredCurrency = preferredCountryCurrencies[country.cca2];
    const currencyEntry = preferredCurrency && currencies[preferredCurrency]
      ? [preferredCurrency, currencies[preferredCurrency]] as const
      : Object.entries(currencies)[0];
    if (!currencyEntry) return [];
    const [currencyCode, currency] = currencyEntry;
    const phoneCode = resolveCountryDialCode(country.cca2, country.idd.root, country.idd.suffixes);
    if (!phoneCode) return [];

    return [{
      id: country.cca2.toLowerCase(),
      code: country.cca2,
      numericCode: country.ccn3 || undefined,
      name: country.name.common,
      nameAr: country.translations.ara?.common ?? country.name.common,
      nameZh: country.translations.zho?.common ?? country.name.common,
      flag: country.flag,
      phoneCode,
      currencyCode,
      currencyName: currency.name,
      currencySymbol: currency.symbol || currencyCode,
      decimalPlaces: resolveDecimalPlaces(currencyCode),
    }];
  })
  .sort((a, b) => a.name.localeCompare(b.name));
