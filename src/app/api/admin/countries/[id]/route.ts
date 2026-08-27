import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCountry } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { updateAdminCountrySchema } from '@/server/validation';
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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('CURRENCY_MANAGE');
    const { id } = await context.params;
    const body = updateAdminCountrySchema.parse(await request.json().catch(() => ({})));

    const existing = await prisma.country.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');

    const mergedPolicy = {
      localCurrencyCode: body.currencyCode ?? existing.currencyCode,
      primaryPriceCurrency: body.primaryPriceCurrency ?? existing.primaryPriceCurrency,
      showPricesInIqd: body.showPricesInIqd ?? existing.showPricesInIqd,
      showPricesInUsd: body.showPricesInUsd ?? existing.showPricesInUsd,
      showPricesInLocal: body.showPricesInLocal ?? existing.showPricesInLocal,
    };
    assertCountryPricePolicy(mergedPolicy);
    const requiredRateCode = mergedPolicy.primaryPriceCurrency === 'LOCAL'
      ? mergedPolicy.localCurrencyCode
      : mergedPolicy.primaryPriceCurrency;
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
    assertCountryPrimaryRate(
      mergedPolicy,
      primaryRate ? { [requiredRateCode]: primaryRate } : {}
    );

    if (body.currencyCode) {
      const currency = await prisma.currency.findUnique({ where: { code: body.currencyCode }, select: { code: true } });
      if (!currency) throw new Error('NOT_FOUND');
    }

    const country = await prisma.country.update({
      where: { id },
      data: {
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
    const exchangeRates = resolveExchangeRateQuotes(
      BASE_CURRENCY,
      [country.currencyCode, 'USD'],
      exchangeRateHistory,
    );
    const exchangeRate = exchangeRates.find((rate) => rate.quoteCurrencyCode === country.currencyCode);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.country.update',
      entityType: 'country',
      entityId: country.id,
      metadata: body,
    });

    return ok({ country: mapCountry(country, exchangeRate, BASE_CURRENCY, exchangeRates) });
  } catch (error) {
    return handleApiError(error);
  }
}
