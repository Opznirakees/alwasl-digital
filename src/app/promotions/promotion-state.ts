export type PromotionState = 'upcoming' | 'live' | 'expired';

export function getPromotionState(startDate: string, endDate: string, now: Date): PromotionState {
  const startsAt = new Date(startDate);
  const endsAt = new Date(endDate);

  if (startsAt > now) return 'upcoming';
  if (endsAt < now) return 'expired';
  return 'live';
}

export function formatPromotionDate(dateString: string, locale: string) {
  return new Date(dateString).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
