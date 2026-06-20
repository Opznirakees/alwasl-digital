import { NextRequest, NextResponse } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { createExcelWorkbookBuffer } from '@/server/excel-export';
import { handleApiError } from '@/server/http';
import { prisma } from '@/server/prisma';
import { adminExportSchema } from '@/server/validation';

export const runtime = 'nodejs';

type ExportValue = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportValue>;

async function excelResponse(type: string, rows: ExportRow[]) {
  const buffer = await createExcelWorkbookBuffer({
    sheetName: type,
    rows,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="alwasl-${type}-${stamp}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('EXPORT_DATA');
    const { type } = adminExportSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    let rows: ExportRow[] = [];

    if (type === 'orders' || type === 'revenue') {
      const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 });
      rows = orders
        .filter((order) => type === 'orders' || order.paymentStatus === 'COMPLETED')
        .map((order) => ({
          id: order.id,
          product: order.gameName,
          package: order.packageName,
          wahoId: order.gameUserId,
          finalPrice: order.finalPrice,
          currency: order.currency,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt.toISOString(),
        }));
    }

    if (type === 'users') {
      const users = await prisma.user.findMany({ orderBy: { registeredAt: 'desc' }, take: 5000 });
      rows = users.map((user) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType,
        level: user.level,
        walletBalance: user.walletBalance,
        totalSpent: user.totalSpent,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason,
        blockedAt: user.blockedAt?.toISOString(),
        registeredAt: user.registeredAt.toISOString(),
      }));
    }

    if (type === 'wallets') {
      const transactions = await prisma.walletTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 });
      const manualDeposits = await prisma.manualDeposit.findMany({
        include: { user: { select: { phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      rows = [
        ...transactions.map((transaction) => ({
          rowType: 'wallet_transaction',
          id: transaction.id,
          userId: transaction.userId,
          userPhone: undefined,
          type: transaction.type,
          status: undefined,
          amount: transaction.amount,
          balance: transaction.balance,
          currency: transaction.currency,
          reference: transaction.reference,
          transactionId: undefined,
          createdAt: transaction.createdAt.toISOString(),
        })),
        ...manualDeposits.map((deposit) => ({
          rowType: 'manual_deposit',
          id: deposit.id,
          userId: deposit.userId,
          userPhone: deposit.user.phone,
          type: deposit.paymentMethod,
          status: deposit.status,
          amount: deposit.amount,
          balance: undefined,
          currency: deposit.currency,
          reference: deposit.walletTransactionId,
          transactionId: deposit.transactionId,
          createdAt: deposit.createdAt.toISOString(),
        })),
      ];
    }

    if (type === 'providers') {
      const providers = await prisma.providerAccount.findMany({
        include: { provider: true },
        orderBy: [{ provider: { priority: 'asc' } }, { priority: 'asc' }],
      });
      rows = providers.map((account) => ({
        id: account.id,
        provider: account.provider.name,
        name: account.name,
        type: account.type,
        status: account.status,
        isActive: account.isActive,
        priority: account.priority,
        balance: account.balance,
        reservedBalance: account.reservedBalance,
        lowBalanceThreshold: account.lowBalanceThreshold,
        currency: account.currency,
      }));
    }

    if (type === 'whatsapp') {
      const notifications = await prisma.whatsAppNotification.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 });
      rows = notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        status: notification.status,
        phone: notification.phone,
        userId: notification.userId,
        orderId: notification.orderId,
        manualDepositId: notification.manualDepositId,
        batchId: notification.batchId,
        providerMessageId: notification.providerMessageId,
        error: notification.error,
        sentAt: notification.sentAt?.toISOString(),
        createdAt: notification.createdAt.toISOString(),
      }));
    }

    if (type === 'promotions') {
      const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
      rows = promotions.map((promotion) => ({
        id: promotion.id,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
        minPurchase: promotion.minPurchase,
        maxDiscount: promotion.maxDiscount,
        usageLimit: promotion.usageLimit,
        usedCount: promotion.usedCount,
        isActive: promotion.isActive,
        startDate: promotion.startDate.toISOString(),
        endDate: promotion.endDate.toISOString(),
      }));
    }

    if (type === 'pricing') {
      const rules = await prisma.customPricingRule.findMany({
        include: {
          product: { select: { name: true } },
          package: { select: { name: true } },
          user: { select: { phone: true } },
        },
        orderBy: [{ isActive: 'desc' }, { priority: 'asc' }, { updatedAt: 'desc' }],
      });
      rows = rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        targetType: rule.targetType,
        priceType: rule.priceType,
        value: rule.value,
        product: rule.product?.name,
        package: rule.package?.name,
        userPhone: rule.user?.phone,
        priority: rule.priority,
        isActive: rule.isActive,
        applyMembershipDiscount: rule.applyMembershipDiscount,
        startDate: rule.startDate?.toISOString(),
        endDate: rule.endDate?.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      }));
    }

    if (type === 'banners') {
      const banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
      rows = banners.map((banner) => ({
        id: banner.id,
        title: banner.title,
        titleAr: banner.titleAr,
        subtitle: banner.subtitle,
        subtitleAr: banner.subtitleAr,
        image: banner.image,
        link: banner.link,
        productId: banner.productId,
        isActive: banner.isActive,
        sortOrder: banner.sortOrder,
        startDate: banner.startDate.toISOString(),
        endDate: banner.endDate.toISOString(),
      }));
    }

    if (type === 'currencies') {
      const countries = await prisma.country.findMany({
        include: { currency: true },
        orderBy: { name: 'asc' },
      });
      const exchangeRates = await prisma.exchangeRate.findMany({
        orderBy: [{ baseCurrencyCode: 'asc' }, { quoteCurrencyCode: 'asc' }],
      });
      rows = [
        ...countries.map((country) => ({
          rowType: 'country',
          id: country.id,
          code: country.code,
          name: country.name,
          nameAr: country.nameAr,
          phoneCode: country.phoneCode,
          currency: country.currencyCode,
          currencyName: country.currency.name,
          symbol: country.currency.symbol,
          decimalPlaces: country.currency.decimalPlaces,
          isActive: country.isActive,
        })),
        ...exchangeRates.map((rate) => ({
          rowType: 'exchange_rate',
          id: rate.id,
          baseCurrency: rate.baseCurrencyCode,
          quoteCurrency: rate.quoteCurrencyCode,
          rate: Number(rate.rate),
          isActive: rate.isActive,
          source: rate.source,
          note: rate.note,
          updatedAt: rate.updatedAt.toISOString(),
        })),
      ];
    }

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.export',
      entityType: 'admin_export',
      entityId: type,
      metadata: { type, rows: rows.length },
    });

    return excelResponse(type, rows);
  } catch (error) {
    return handleApiError(error);
  }
}
