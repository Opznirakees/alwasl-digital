import { handleApiError, ok } from '@/server/http';
import { mapCountry, mapCurrency } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE_CURRENCY = 'IQD';
const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      include: { currency: true },
      orderBy: { name: 'asc' },
    });
    const quoteCurrencyCodes = countries
      .map((country) => country.currencyCode)
      .filter((currencyCode) => currencyCode !== BASE_CURRENCY);
    const exchangeRates = await prisma.exchangeRate.findMany({
      where: {
        baseCurrencyCode: BASE_CURRENCY,
        quoteCurrencyCode: { in: quoteCurrencyCodes },
        isActive: true,
      },
    });
    const ratesByQuote = new Map(exchangeRates.map((rate) => [rate.quoteCurrencyCode, rate]));

    return ok(
      {
        baseCurrency: BASE_CURRENCY,
        countries: countries.map((country) => mapCountry(country, ratesByQuote.get(country.currencyCode), BASE_CURRENCY)),
        currencies: countries.map((country) => mapCurrency(country.currency)),
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
