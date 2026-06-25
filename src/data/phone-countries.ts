import rawCountries from 'world-countries';

interface WorldCountry {
  cca2: string;
  flag?: string;
  idd?: {
    root?: string;
    suffixes?: string[];
  };
  name: {
    common: string;
  };
  translations?: {
    ara?: {
      common: string;
    };
    zho?: {
      common: string;
    };
  };
}

export interface PhoneCountry {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  nameZh: string;
  flag: string;
  phoneCode: string;
  searchText: string;
}

const preferredCountryCodes = ['IQ', 'NL', 'CN', 'US', 'GB', 'SA', 'AE', 'TR', 'DE', 'FR'];

function normalizePhoneCode(root?: string, suffixes?: string[]) {
  const suffix = suffixes?.find((value) => value !== undefined) ?? '';
  const code = `${root ?? ''}${suffix}`.replace(/\D/g, '');
  return code ? `+${code}` : null;
}

export const phoneCountries: PhoneCountry[] = (rawCountries as WorldCountry[])
  .map((country) => {
    const phoneCode = normalizePhoneCode(country.idd?.root, country.idd?.suffixes);
    if (!phoneCode) return null;

    const nameAr = country.translations?.ara?.common ?? country.name.common;
    const nameZh = country.translations?.zho?.common ?? country.name.common;

    return {
      id: country.cca2.toLowerCase(),
      code: country.cca2,
      name: country.name.common,
      nameAr,
      nameZh,
      flag: country.flag ?? '',
      phoneCode,
      searchText: `${country.name.common} ${nameAr} ${nameZh} ${country.cca2} ${phoneCode}`.toLowerCase(),
    };
  })
  .filter((country): country is PhoneCountry => Boolean(country))
  .sort((a, b) => {
    const preferredA = preferredCountryCodes.indexOf(a.code);
    const preferredB = preferredCountryCodes.indexOf(b.code);

    if (preferredA !== -1 || preferredB !== -1) {
      return (preferredA === -1 ? 1000 : preferredA) - (preferredB === -1 ? 1000 : preferredB);
    }

    return a.name.localeCompare(b.name);
  });

export const phoneDialCodesByLength = Array.from(
  new Set(phoneCountries.map((country) => country.phoneCode.replace(/\D/g, '')))
).sort((a, b) => b.length - a.length);

export function getDefaultPhoneCountry() {
  return phoneCountries.find((country) => country.code === 'IQ') ?? phoneCountries[0];
}

export function getPhoneCountryById(countryId: string) {
  return phoneCountries.find((country) => country.id === countryId);
}

export function findPhoneDialCodeInNumber(normalizedPhone: string) {
  return phoneDialCodesByLength.find((dialCode) => normalizedPhone.startsWith(dialCode)) ?? null;
}
