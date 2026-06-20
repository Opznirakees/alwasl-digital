import type { UserLevel } from '@/types';

export type LegacyMembershipLevel = 'platinum';
export type ActiveMembershipLevel = UserLevel;
export type AnyMembershipLevel = ActiveMembershipLevel | LegacyMembershipLevel;

export interface MembershipTier {
  level: ActiveMembershipLevel;
  en: string;
  ar: string;
  zh: string;
  color: string;
  minSpent: number;
  discountPercentage: number;
}

export const activeMembershipLevelOptions = ['bronze', 'silver', 'gold', 'diamond'] as const satisfies readonly ActiveMembershipLevel[];

export const membershipLevels = [
  {
    level: 'bronze',
    en: 'Standard',
    ar: 'عادي',
    zh: '标准',
    color: '#64748b',
    minSpent: 0,
    discountPercentage: 0,
  },
  {
    level: 'silver',
    en: 'Silver',
    ar: 'فضي',
    zh: '银卡',
    color: '#94a3b8',
    minSpent: 2_000_000,
    discountPercentage: 2,
  },
  {
    level: 'gold',
    en: 'Gold',
    ar: 'ذهبي',
    zh: '金卡',
    color: '#d97706',
    minSpent: 8_000_000,
    discountPercentage: 4,
  },
  {
    level: 'diamond',
    en: 'Diamond',
    ar: 'ماسي',
    zh: '钻石',
    color: '#0891b2',
    minSpent: 15_000_000,
    discountPercentage: 6,
  },
] as const satisfies readonly MembershipTier[];

export const activeMembershipLevelIds = membershipLevels.map((tier) => tier.level);

export const levelLabels = Object.fromEntries(
  membershipLevels.map(({ level, en, ar, zh, color, minSpent }) => [
    level,
    { en, ar, zh, color, minSpent },
  ])
) as Record<ActiveMembershipLevel, Pick<MembershipTier, 'en' | 'ar' | 'zh' | 'color' | 'minSpent'>>;

export const levelDiscounts = Object.fromEntries(
  membershipLevels.map(({ level, discountPercentage }) => [level, discountPercentage])
) as Record<ActiveMembershipLevel, number>;

export function resolveMembershipForSpend(totalSpent: number): MembershipTier {
  const normalizedSpend = Number.isFinite(totalSpent) ? Math.max(0, totalSpent) : 0;
  return [...membershipLevels]
    .reverse()
    .find((tier) => normalizedSpend >= tier.minSpent) ?? membershipLevels[0];
}

export function getMembershipLabel(level: AnyMembershipLevel) {
  return levelLabels[level as ActiveMembershipLevel] ?? levelLabels.bronze;
}

export function getMembershipDiscount(level: AnyMembershipLevel) {
  return levelDiscounts[level as ActiveMembershipLevel] ?? 0;
}

export function getNextMembershipLevel(level: AnyMembershipLevel) {
  const activeLevel = levelLabels[level as ActiveMembershipLevel] ? level : 'bronze';
  const currentIndex = membershipLevels.findIndex((tier) => tier.level === activeLevel);
  return currentIndex >= 0 ? membershipLevels[currentIndex + 1] ?? null : membershipLevels[1];
}
