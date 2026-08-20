import worldCountries from 'world-countries';

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

function resolvePhoneCode(country: (typeof worldCountries)[number]) {
  const root = country.idd.root;
  if (!root) return '';
  if (root === '+1') return root;
  return `${root}${country.idd.suffixes?.[0] ?? ''}`;
}

function resolveDecimalPlaces(currencyCode: string) {
  if (currencyCode === 'IQD') return 0;
  if (['BHD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'].includes(currencyCode)) return 3;
  return 2;
}

export const countryCatalog: CountryCatalogItem[] = worldCountries
  .flatMap((country) => {
    const currencyEntry = Object.entries(country.currencies ?? {})[0];
    if (!currencyEntry) return [];
    const [currencyCode, currency] = currencyEntry;
    const phoneCode = resolvePhoneCode(country);
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
