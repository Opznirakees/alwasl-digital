import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCountry } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminCountrySchema } from '@/server/validation';
import {
  assertCountryPrimaryRate,
  assertCountryPricePolicy,
} from '@/server/domain/country-pricing';
import {
  resolveExchangeRate,
  resolveExchangeRateQuotes,
} from '@/server/domain/exchange-rates';

export const runtime = 'nodejs';

const BASE_CURRENCY = 'IQD';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('CURRENCY_MANAGE');
    const body = createAdminCountrySchema.parse(await request.json());
    assertCountryPricePolicy({
      localCurrencyCode: body.currencyCode,
      primaryPriceCurrency: body.primaryPriceCurrency,
      showPricesInIqd: body.showPricesInIqd,
      showPricesInUsd: body.showPricesInUsd,
      showPricesInLocal: body.showPricesInLocal,
    });
    const requiredRateCode = body.primaryPriceCurrency === 'LOCAL'
      ? body.currencyCode
      : body.primaryPriceCurrency;
    const now = new Date();
    const exchangeRateHistory = await prisma.exchangeRate.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
    });
    const primaryRate = requiredRateCode === BASE_CURRENCY
      ? 1
      : resolveExchangeRate(BASE_CURRENCY, requiredRateCode, exchangeRateHistory);
    assertCountryPrimaryRate({
      localCurrencyCode: body.currencyCode,
      primaryPriceCurrency: body.primaryPriceCurrency,
      showPricesInIqd: body.showPricesInIqd,
      showPricesInUsd: body.showPricesInUsd,
      showPricesInLocal: body.showPricesInLocal,
    }, primaryRate ? { [requiredRateCode]: primaryRate } : {});

    const country = await prisma.$transaction(async (tx) => {
      await tx.currency.upsert({
        where: { code: body.currencyCode },
        update: {
          name: body.currencyName,
          symbol: body.currencySymbol,
          decimalPlaces: body.decimalPlaces,
          isActive: true,
        },
        create: {
          code: body.currencyCode,
          name: body.currencyName,
          symbol: body.currencySymbol,
          decimalPlaces: body.decimalPlaces,
          isActive: true,
        },
      });

      return tx.country.upsert({
        where: { code: body.code },
        update: {
          name: body.name,
          nameAr: body.nameAr,
          nameZh: body.nameZh,
          flag: body.flag,
          phoneCode: body.phoneCode,
          currencyCode: body.currencyCode,
          primaryPriceCurrency: body.primaryPriceCurrency,
          showPricesInIqd: body.showPricesInIqd,
          showPricesInUsd: body.showPricesInUsd,
          showPricesInLocal: body.showPricesInLocal,
          isActive: body.isActive,
        },
        create: {
          id: body.id,
          code: body.code,
          name: body.name,
          nameAr: body.nameAr,
          nameZh: body.nameZh,
          flag: body.flag,
          phoneCode: body.phoneCode,
          currencyCode: body.currencyCode,
          primaryPriceCurrency: body.primaryPriceCurrency,
          showPricesInIqd: body.showPricesInIqd,
          showPricesInUsd: body.showPricesInUsd,
          showPricesInLocal: body.showPricesInLocal,
          isActive: body.isActive,
        },
        include: { currency: true },
      });
    });

    const exchangeRates = resolveExchangeRateQuotes(
      BASE_CURRENCY,
      [country.currencyCode, 'USD'],
      exchangeRateHistory,
    );
    const localRate = exchangeRates.find((rate) => rate.quoteCurrencyCode === country.currencyCode);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.country.configure',
      entityType: 'country',
      entityId: country.id,
      metadata: {
        code: country.code,
        currencyCode: country.currencyCode,
        primaryPriceCurrency: country.primaryPriceCurrency,
        showPricesInIqd: country.showPricesInIqd,
        showPricesInUsd: country.showPricesInUsd,
        showPricesInLocal: country.showPricesInLocal,
      },
    });

    return ok({
      country: mapCountry(country, localRate, BASE_CURRENCY, exchangeRates),
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
