const ROOT_ONLY_COUNTRIES = new Set(['CA', 'US']);

export function resolveCountryDialCode(
  countryCode: string,
  root?: string,
  suffixes?: string[]
) {
  if (!root) return null;

  const suffix = root === '+7' || ROOT_ONLY_COUNTRIES.has(countryCode)
    ? ''
    : suffixes?.[0] ?? '';
  const digits = `${root}${suffix}`.replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}
