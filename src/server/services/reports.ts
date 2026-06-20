import { prisma } from '../prisma';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ReportBucket {
  key: string;
  label: string;
  start: string;
  end: string;
  orders: number;
  completedOrders: number;
  failedOrders: number;
  refundedOrders: number;
  revenue: number;
  walletRevenue: number;
  externalPaymentRevenue: number;
  manualDeposits: number;
  manualDepositAmount: number;
  newUsers: number;
}

export interface ReportSummary {
  orders: number;
  completedOrders: number;
  failedOrders: number;
  refundedOrders: number;
  revenue: number;
  walletRevenue: number;
  externalPaymentRevenue: number;
  manualDeposits: number;
  manualDepositAmount: number;
  newUsers: number;
  avgOrderValue: number;
  conversionRate: number;
  refundRate: number;
}

interface BuildReportInput {
  period?: ReportPeriod;
  from?: string;
  to?: string;
}

const dayMs = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date) {
  const day = date.getUTCDay() || 7;
  return addDays(startOfUtcDay(date), 1 - day);
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function addYears(date: Date, years: number) {
  return new Date(Date.UTC(date.getUTCFullYear() + years, 0, 1));
}

function parseReportDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function isoWeekParts(date: Date) {
  const target = startOfUtcDay(date);
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / dayMs) + 1) / 7);

  return { year: target.getUTCFullYear(), week };
}

function reportBucketKey(period: ReportPeriod, date: Date) {
  if (period === 'daily') {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }

  if (period === 'weekly') {
    const { year, week } = isoWeekParts(date);
    return `${year}-W${pad(week)}`;
  }

  if (period === 'monthly') {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
  }

  return String(date.getUTCFullYear());
}

function startOfReportPeriod(period: ReportPeriod, date: Date) {
  if (period === 'daily') return startOfUtcDay(date);
  if (period === 'weekly') return startOfUtcWeek(date);
  if (period === 'monthly') return startOfUtcMonth(date);
  return startOfUtcYear(date);
}

function addReportPeriod(period: ReportPeriod, date: Date) {
  if (period === 'daily') return addDays(date, 1);
  if (period === 'weekly') return addDays(date, 7);
  if (period === 'monthly') return addMonths(date, 1);
  return addYears(date, 1);
}

function formatDateLabel(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en', { timeZone: 'UTC', ...options }).format(date);
}

function reportBucketLabel(period: ReportPeriod, start: Date, end: Date) {
  if (period === 'daily') {
    return formatDateLabel(start, { month: 'short', day: 'numeric' });
  }

  if (period === 'weekly') {
    const { week } = isoWeekParts(start);
    const endInclusive = addDays(end, -1);
    return `Week ${week} (${formatDateLabel(start, { month: 'short', day: 'numeric' })} - ${formatDateLabel(endInclusive, {
      month: 'short',
      day: 'numeric',
    })})`;
  }

  if (period === 'monthly') {
    return formatDateLabel(start, { month: 'short', year: 'numeric' });
  }

  return String(start.getUTCFullYear());
}

export function getReportRange(period: ReportPeriod, now = new Date(), from?: string, to?: string) {
  if (from && to) {
    return {
      from: parseReportDate(from),
      to: parseReportDate(to),
    };
  }

  const start = startOfReportPeriod(period, now);
  return {
    from: start,
    to: addReportPeriod(period, start),
  };
}

export function createReportBuckets(period: ReportPeriod, from: Date, to: Date): ReportBucket[] {
  const buckets: ReportBucket[] = [];
  let cursor = startOfReportPeriod(period, from);

  while (cursor < to) {
    const next = addReportPeriod(period, cursor);
    buckets.push({
      key: reportBucketKey(period, cursor),
      label: reportBucketLabel(period, cursor, next),
      start: cursor.toISOString(),
      end: next.toISOString(),
      orders: 0,
      completedOrders: 0,
      failedOrders: 0,
      refundedOrders: 0,
      revenue: 0,
      walletRevenue: 0,
      externalPaymentRevenue: 0,
      manualDeposits: 0,
      manualDepositAmount: 0,
      newUsers: 0,
    });
    cursor = next;
  }

  return buckets;
}

export function summarizeReportBuckets(buckets: ReportBucket[]): ReportSummary {
  const summary = buckets.reduce<ReportSummary>((totals, bucket) => ({
    orders: totals.orders + bucket.orders,
    completedOrders: totals.completedOrders + bucket.completedOrders,
    failedOrders: totals.failedOrders + bucket.failedOrders,
    refundedOrders: totals.refundedOrders + bucket.refundedOrders,
    revenue: totals.revenue + bucket.revenue,
    walletRevenue: totals.walletRevenue + bucket.walletRevenue,
    externalPaymentRevenue: totals.externalPaymentRevenue + bucket.externalPaymentRevenue,
    manualDeposits: totals.manualDeposits + bucket.manualDeposits,
    manualDepositAmount: totals.manualDepositAmount + bucket.manualDepositAmount,
    newUsers: totals.newUsers + bucket.newUsers,
    avgOrderValue: 0,
    conversionRate: 0,
    refundRate: 0,
  }), {
    orders: 0,
    completedOrders: 0,
    failedOrders: 0,
    refundedOrders: 0,
    revenue: 0,
    walletRevenue: 0,
    externalPaymentRevenue: 0,
    manualDeposits: 0,
    manualDepositAmount: 0,
    newUsers: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    refundRate: 0,
  });

  return {
    ...summary,
    avgOrderValue: summary.completedOrders ? Math.round(summary.revenue / summary.completedOrders) : 0,
    conversionRate: summary.orders ? Math.round((summary.completedOrders / summary.orders) * 1000) / 10 : 0,
    refundRate: summary.orders ? Math.round((summary.refundedOrders / summary.orders) * 1000) / 10 : 0,
  };
}

export async function buildReport(input: BuildReportInput = {}) {
  const period = input.period ?? 'daily';
  const range = getReportRange(period, new Date(), input.from, input.to);
  const buckets = createReportBuckets(period, range.from, range.to);
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  const [orders, manualDeposits, users] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: range.from, lt: range.to } },
      orderBy: { createdAt: 'asc' },
      take: 100_000,
    }),
    prisma.manualDeposit.findMany({
      where: { createdAt: { gte: range.from, lt: range.to } },
      orderBy: { createdAt: 'asc' },
      take: 100_000,
    }),
    prisma.user.findMany({
      where: { registeredAt: { gte: range.from, lt: range.to } },
      orderBy: { registeredAt: 'asc' },
      take: 100_000,
    }),
  ]);

  for (const order of orders) {
    const key = reportBucketKey(period, startOfReportPeriod(period, order.createdAt));
    const bucket = bucketByKey.get(key);
    if (!bucket) continue;

    bucket.orders += 1;
    if (order.status === 'COMPLETED') bucket.completedOrders += 1;
    if (order.status === 'FAILED') bucket.failedOrders += 1;
    if (order.status === 'REFUNDED') bucket.refundedOrders += 1;

    if (order.paymentStatus === 'COMPLETED') {
      bucket.revenue += order.finalPrice;
      if (order.paymentMethod === 'WALLET') {
        bucket.walletRevenue += order.finalPrice;
      } else {
        bucket.externalPaymentRevenue += order.finalPrice;
      }
    }
  }

  for (const deposit of manualDeposits) {
    const key = reportBucketKey(period, startOfReportPeriod(period, deposit.createdAt));
    const bucket = bucketByKey.get(key);
    if (!bucket) continue;

    bucket.manualDeposits += 1;
    if (deposit.status === 'APPROVED') {
      bucket.manualDepositAmount += deposit.amount;
    }
  }

  for (const user of users) {
    const key = reportBucketKey(period, startOfReportPeriod(period, user.registeredAt));
    const bucket = bucketByKey.get(key);
    if (!bucket) continue;

    bucket.newUsers += 1;
  }

  return {
    period,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    summary: summarizeReportBuckets(buckets),
    buckets,
  };
}
