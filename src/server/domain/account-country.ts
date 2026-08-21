export const ARAB_COUNTRY_IDS = new Set([
  'ae', 'bh', 'dj', 'dz', 'eg', 'iq', 'jo', 'km', 'kw', 'lb', 'ly',
  'ma', 'mr', 'om', 'ps', 'qa', 'sa', 'sd', 'so', 'sy', 'tn', 'ye',
]);

interface CountryDialCode {
  id: string;
  phoneCode: string;
}

export type SuggestedLanguage = 'en' | 'ar' | 'zh';

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function inferCountryIdFromPhone(phone: string, countries: CountryDialCode[]) {
  const normalizedPhone = digitsOnly(phone);
  if (!normalizedPhone) return null;

  const match = [...countries]
    .filter((country) => {
      const dialCode = digitsOnly(country.phoneCode);
      return dialCode.length > 0 && normalizedPhone.startsWith(dialCode);
    })
    .sort((a, b) => digitsOnly(b.phoneCode).length - digitsOnly(a.phoneCode).length)[0];

  return match?.id ?? null;
}

export function suggestedLanguageForCountry(countryId?: string | null): SuggestedLanguage {
  const normalized = countryId?.trim().toLowerCase();
  if (normalized === 'cn') return 'zh';
  if (normalized && ARAB_COUNTRY_IDS.has(normalized)) return 'ar';
  return 'en';
}
