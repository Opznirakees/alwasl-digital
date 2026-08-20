import { prisma } from '../prisma';

export function applyContentPlaceholders(template: string, values: Record<string, string | number | undefined>) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
    const value = values[key];
    return value === undefined ? '' : String(value);
  });
}

export async function getManagedContent(
  key: string,
  fallback: string,
  values: Record<string, string | number | undefined> = {}
) {
  const override = await prisma.contentOverride.findUnique({
    where: { key },
    select: { valueEn: true, isActive: true },
  });
  const template = override?.isActive && override.valueEn.trim()
    ? override.valueEn
    : fallback;
  return applyContentPlaceholders(template, values);
}
