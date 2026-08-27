export interface EffectiveExchangeRate {
  id: string;
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number | string | { toString(): string };
  isActive: boolean;
  effectiveFrom: Date | string;
  effectiveUntil?: Date | string | null;
  updatedAt?: Date | string;
}

export interface ResolvedExchangeRate {
  id: string;
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number;
  isActive: true;
  effectiveFrom: Date;
  effectiveUntil: null;
  updatedAt: Date;
}

interface RateEdge {
  currency: string;
  factor: number;
  effectiveFrom: Date;
}

function asDate(value: Date | string) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('EXCHANGE_RATE_DATE_INVALID');
  return date;
}

function pairKey(left: string, right: string) {
  return [left, right].sort().join(':');
}

export function floorToMinute(value: Date) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('EXCHANGE_RATE_DATE_INVALID');
  date.setUTCSeconds(0, 0);
  return date;
}

export function isExchangeRateEffective(rate: EffectiveExchangeRate, at = new Date()) {
  if (!rate.isActive) return false;
  const effectiveFrom = asDate(rate.effectiveFrom);
  const effectiveUntil = rate.effectiveUntil ? asDate(rate.effectiveUntil) : null;
  return effectiveFrom.getTime() <= at.getTime()
    && (!effectiveUntil || effectiveUntil.getTime() > at.getTime());
}

function buildCurrentRateGraph(rates: EffectiveExchangeRate[], at: Date) {
  const latestByPair = new Map<string, EffectiveExchangeRate>();
  for (const rate of rates) {
    if (!isExchangeRateEffective(rate, at)) continue;
    const numericRate = Number(rate.rate);
    if (!Number.isFinite(numericRate) || numericRate <= 0) continue;
    const key = pairKey(rate.baseCurrencyCode, rate.quoteCurrencyCode);
    const current = latestByPair.get(key);
    if (!current || asDate(rate.effectiveFrom).getTime() > asDate(current.effectiveFrom).getTime()) {
      latestByPair.set(key, rate);
    }
  }

  const graph = new Map<string, RateEdge[]>();
  const addEdge = (from: string, edge: RateEdge) => {
    const edges = graph.get(from) ?? [];
    edges.push(edge);
    graph.set(from, edges);
  };

  for (const rate of latestByPair.values()) {
    const factor = Number(rate.rate);
    const effectiveFrom = asDate(rate.effectiveFrom);
    addEdge(rate.baseCurrencyCode, {
      currency: rate.quoteCurrencyCode,
      factor,
      effectiveFrom,
    });
    addEdge(rate.quoteCurrencyCode, {
      currency: rate.baseCurrencyCode,
      factor: 1 / factor,
      effectiveFrom,
    });
  }
  return graph;
}

export function resolveExchangeRateDetailed(
  baseCurrencyCode: string,
  quoteCurrencyCode: string,
  rates: EffectiveExchangeRate[],
  at = new Date(),
) {
  if (baseCurrencyCode === quoteCurrencyCode) {
    return { rate: 1, effectiveFrom: new Date(0) };
  }

  const graph = buildCurrentRateGraph(rates, at);
  const queue = [{ currency: baseCurrencyCode, factor: 1, effectiveFrom: new Date(0) }];
  const visited = new Set([baseCurrencyCode]);

  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of graph.get(current.currency) ?? []) {
      if (visited.has(edge.currency)) continue;
      const next = {
        currency: edge.currency,
        factor: current.factor * edge.factor,
        effectiveFrom: new Date(Math.max(current.effectiveFrom.getTime(), edge.effectiveFrom.getTime())),
      };
      if (edge.currency === quoteCurrencyCode) {
        return { rate: next.factor, effectiveFrom: next.effectiveFrom };
      }
      visited.add(edge.currency);
      queue.push(next);
    }
  }
  return null;
}

export function resolveExchangeRate(
  baseCurrencyCode: string,
  quoteCurrencyCode: string,
  rates: EffectiveExchangeRate[],
  at = new Date(),
) {
  return resolveExchangeRateDetailed(baseCurrencyCode, quoteCurrencyCode, rates, at)?.rate ?? null;
}

export function resolveExchangeRateQuotes(
  baseCurrencyCode: string,
  quoteCurrencyCodes: string[],
  rates: EffectiveExchangeRate[],
  at = new Date(),
): ResolvedExchangeRate[] {
  return [...new Set(quoteCurrencyCodes)]
    .filter((quoteCurrencyCode) => quoteCurrencyCode !== baseCurrencyCode)
    .flatMap((quoteCurrencyCode) => {
      const resolved = resolveExchangeRateDetailed(baseCurrencyCode, quoteCurrencyCode, rates, at);
      if (!resolved) return [];
      return [{
        id: `resolved:${baseCurrencyCode}:${quoteCurrencyCode}`,
        baseCurrencyCode,
        quoteCurrencyCode,
        rate: resolved.rate,
        isActive: true as const,
        effectiveFrom: resolved.effectiveFrom,
        effectiveUntil: null,
        updatedAt: resolved.effectiveFrom,
      }];
    });
}
