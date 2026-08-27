import { handleApiError, ok } from '@/server/http';
import { mapCountry, mapCurrency } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { resolveExchangeRateQuotes } from '@/server/domain/exchange-rates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE_CURRENCY = 'IQD';
const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const now = new Date();
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      include: { currency: true },
      orderBy: { name: 'asc' },
    });
    const quoteCurrencyCodes = [...new Set([
      ...countries.map((country) => country.currencyCode),
      'USD',
    ])].filter((currencyCode) => currencyCode !== BASE_CURRENCY);
    const exchangeRateHistory = await prisma.exchangeRate.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gt: now } },
        ],
      },
    });
    const exchangeRates = resolveExchangeRateQuotes(
      BASE_CURRENCY,
      quoteCurrencyCodes,
      exchangeRateHistory,
    );
    const ratesByQuote = new Map(exchangeRates.map((rate) => [rate.quoteCurrencyCode, rate]));

    return ok(
      {
        baseCurrency: BASE_CURRENCY,
        countries: countries.map((country) => mapCountry(
          country,
          ratesByQuote.get(country.currencyCode),
          BASE_CURRENCY,
          exchangeRates
        )),
        currencies: [...new Map(countries.map((country) => [country.currency.code, country.currency])).values()]
          .map(mapCurrency),
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
