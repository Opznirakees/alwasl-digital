import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapExchangeRate } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminExchangeRateSchema } from '@/server/validation';
import { floorToMinute } from '@/server/domain/exchange-rates';

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

    const effectiveFrom = floorToMinute(body.effectiveFrom ? new Date(body.effectiveFrom) : new Date());
    const pairWhere = {
      OR: [
        {
          baseCurrencyCode: body.baseCurrencyCode,
          quoteCurrencyCode: body.quoteCurrencyCode,
        },
        {
          baseCurrencyCode: body.quoteCurrencyCode,
          quoteCurrencyCode: body.baseCurrencyCode,
        },
      ],
    };

    const exchangeRate = await prisma.$transaction(async (tx) => {
      const nextRate = await tx.exchangeRate.findFirst({
        where: {
          ...pairWhere,
          isActive: true,
          effectiveFrom: { gt: effectiveFrom },
        },
        orderBy: { effectiveFrom: 'asc' },
      });
      if (body.isActive) {
        await tx.exchangeRate.updateMany({
          where: {
            AND: [
              pairWhere,
              { isActive: true },
              { effectiveFrom: { lt: effectiveFrom } },
              {
                OR: [
                  { effectiveUntil: null },
                  { effectiveUntil: { gt: effectiveFrom } },
                ],
              },
            ],
          },
          data: { effectiveUntil: effectiveFrom },
        });
        await tx.exchangeRate.updateMany({
          where: {
            baseCurrencyCode: body.quoteCurrencyCode,
            quoteCurrencyCode: body.baseCurrencyCode,
            effectiveFrom,
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      const data = {
        rate: body.rate,
        isActive: body.isActive,
        source: 'manual',
        note: cleanOptional(body.note),
        updatedByAdminId: admin.id,
        effectiveUntil: body.isActive ? nextRate?.effectiveFrom ?? null : null,
      };
      return tx.exchangeRate.upsert({
        where: {
          baseCurrencyCode_quoteCurrencyCode_effectiveFrom: {
            baseCurrencyCode: body.baseCurrencyCode,
            quoteCurrencyCode: body.quoteCurrencyCode,
            effectiveFrom,
          },
        },
        update: data,
        create: {
          baseCurrencyCode: body.baseCurrencyCode,
          quoteCurrencyCode: body.quoteCurrencyCode,
          effectiveFrom,
          ...data,
        },
      });
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.exchange_rate.set',
      entityType: 'exchange_rate',
      entityId: exchangeRate.id,
      metadata: {
        baseCurrencyCode: exchangeRate.baseCurrencyCode,
        quoteCurrencyCode: exchangeRate.quoteCurrencyCode,
        rate: Number(exchangeRate.rate),
        isActive: exchangeRate.isActive,
        effectiveFrom: exchangeRate.effectiveFrom.toISOString(),
        effectiveUntil: exchangeRate.effectiveUntil?.toISOString(),
      },
    });

    return ok({ exchangeRate: mapExchangeRate(exchangeRate) });
  } catch (error) {
    return handleApiError(error);
  }
}
