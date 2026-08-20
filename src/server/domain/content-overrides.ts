export type ContentLanguage = 'en' | 'ar' | 'zh';

interface ContentDefaults {
  en: string;
  ar: string;
  zh?: string;
}

export interface ContentOverrideValue {
  isActive: boolean;
  valueEn: string;
  valueAr: string;
  valueZh?: string | null;
}

export function extractContentPlaceholders(value: string) {
  return [...new Set(
    [...value.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((match) => match[1])
  )].sort();
}

export function assertContentPlaceholdersPreserved(source: string, candidate: string) {
  const required = extractContentPlaceholders(source);
  const actual = new Set(extractContentPlaceholders(candidate));
  if (required.some((placeholder) => !actual.has(placeholder))) {
    throw new Error('CONTENT_PLACEHOLDER_MISMATCH');
  }
}

export function resolveContentValue(
  language: ContentLanguage,
  defaults: ContentDefaults,
  override?: ContentOverrideValue | null
) {
  const fallback = language === 'ar' ? defaults.ar : language === 'zh' ? defaults.zh || defaults.en : defaults.en;
  if (!override?.isActive) return fallback;

  const value = language === 'ar'
    ? override.valueAr
    : language === 'zh'
      ? override.valueZh
      : override.valueEn;

  return value?.trim() || fallback;
}
