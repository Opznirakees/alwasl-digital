import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapExchangeRate } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminExchangeRateSchema } from '@/server/validation';

export const runtime = 'nodejs';

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('CURRENCY_MANAGE');
    const body = createAdminExchangeRateSchema.parse(await request.json().catch(() => ({})));
    const currencies = await prisma.currency.findMany({
      where: { code: { in: [body.baseCurrencyCode, body.quoteCurrencyCode] } },
      select: { code: true },
    });
    if (currencies.length !== 2) throw new Error('NOT_FOUND');

    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        baseCurrencyCode_quoteCurrencyCode: {
          baseCurrencyCode: body.baseCurrencyCode,
          quoteCurrencyCode: body.quoteCurrencyCode,
        },
      },
      update: {
        rate: body.rate,
        isActive: body.isActive,
        source: 'manual',
        note: cleanOptional(body.note),
        updatedByAdminId: admin.id,
      },
      create: {
        baseCurrencyCode: body.baseCurrencyCode,
        quoteCurrencyCode: body.quoteCurrencyCode,
        rate: body.rate,
        isActive: body.isActive,
        source: 'manual',
        note: cleanOptional(body.note),
        updatedByAdminId: admin.id,
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.exchange_rate.upsert',
      entityType: 'exchange_rate',
      entityId: exchangeRate.id,
      metadata: {
        baseCurrencyCode: exchangeRate.baseCurrencyCode,
        quoteCurrencyCode: exchangeRate.quoteCurrencyCode,
        rate: Number(exchangeRate.rate),
        isActive: exchangeRate.isActive,
      },
    });

    return ok({ exchangeRate: mapExchangeRate(exchangeRate) });
  } catch (error) {
    return handleApiError(error);
  }
}
