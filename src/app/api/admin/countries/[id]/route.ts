import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCountry } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { updateAdminCountrySchema } from '@/server/validation';

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

    const existing = await prisma.country.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new Error('NOT_FOUND');

    if (body.currencyCode) {
      const currency = await prisma.currency.findUnique({ where: { code: body.currencyCode }, select: { code: true } });
      if (!currency) throw new Error('NOT_FOUND');
    }

    const country = await prisma.country.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        flag: body.flag,
        phoneCode: body.phoneCode,
        currencyCode: body.currencyCode,
        isActive: body.isActive,
      },
      include: { currency: true },
    });
    const exchangeRate = country.currencyCode === BASE_CURRENCY
      ? null
      : await prisma.exchangeRate.findUnique({
          where: {
            baseCurrencyCode_quoteCurrencyCode: {
              baseCurrencyCode: BASE_CURRENCY,
              quoteCurrencyCode: country.currencyCode,
            },
          },
        });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.country.update',
      entityType: 'country',
      entityId: country.id,
      metadata: body,
    });

    return ok({ country: mapCountry(country, exchangeRate, BASE_CURRENCY) });
  } catch (error) {
    return handleApiError(error);
  }
}
