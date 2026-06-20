import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { handleApiError, ok } from '@/server/http';
import {
  mapAdminAuditLog,
  mapBanner,
  mapCountry,
  mapCustomPricingRule,
  mapExchangeRate,
  mapManualDeposit,
  mapOrder,
  mapProduct,
  mapPromotion,
  mapProviderAccount,
  mapProviderBalanceAlert,
  mapUser,
  mapWalletTransaction,
  mapWhatsAppNotification,
} from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
const BASE_CURRENCY = 'IQD';

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('ADMIN_DASHBOARD_VIEW');
    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.summary.view',
      entityType: 'admin_dashboard',
      metadata: {
        usersTake: 50,
        ordersTake: 100,
        walletTransactionsTake: 100,
        manualDepositsTake: 100,
        bannersTake: 100,
        countriesTake: 100,
        exchangeRatesTake: 100,
        customPricingRulesTake: 200,
        providerRequestsTake: 100,
        whatsappNotificationsTake: 100,
        auditLogsTake: 50,
      },
    });

    const [
      users,
      products,
      orders,
      walletTransactions,
      manualDeposits,
      providerAccounts,
      providerBalanceAlerts,
      promotions,
      banners,
      countries,
      exchangeRates,
      customPricingRules,
      providerRequests,
      whatsappNotifications,
      auditLogs,
      totalUsers,
      totalOrders,
      completedOrders,
      failedOrders,
      revenueAggregate,
    ] = await Promise.all([
      prisma.user.findMany({ orderBy: { registeredAt: 'desc' }, take: 50 }),
      prisma.product.findMany({
        include: { packages: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.walletTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.manualDeposit.findMany({
        include: {
          user: { select: { id: true, phone: true } },
          reviewedByAdmin: { select: { id: true, name: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 100,
      }),
      prisma.providerAccount.findMany({
        include: { provider: true },
        orderBy: [{ provider: { priority: 'asc' } }, { priority: 'asc' }],
      }),
      prisma.providerBalanceAlert.findMany({
        where: { status: { in: ['OPEN', 'NOTIFIED'] } },
        include: {
          providerAccount: {
            select: {
              id: true,
              name: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.promotion.findMany({
        orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
      }),
      prisma.banner.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 100,
      }),
      prisma.country.findMany({
        include: { currency: true },
        orderBy: { name: 'asc' },
        take: 100,
      }),
      prisma.exchangeRate.findMany({
        orderBy: [{ baseCurrencyCode: 'asc' }, { quoteCurrencyCode: 'asc' }],
        take: 100,
      }),
      prisma.customPricingRule.findMany({
        include: {
          product: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
          user: { select: { id: true, phone: true } },
        },
        orderBy: [{ isActive: 'desc' }, { priority: 'asc' }, { updatedAt: 'desc' }],
        take: 200,
      }),
      prisma.providerRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.whatsAppNotification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.adminAuditLog.findMany({
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: 'FAILED' } }),
      prisma.order.aggregate({
        _sum: { finalPrice: true },
        where: { paymentStatus: 'COMPLETED' },
      }),
    ]);

    const totalRevenue = revenueAggregate._sum.finalPrice ?? 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRevenue = await prisma.order.aggregate({
      _sum: { finalPrice: true },
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: { gte: todayStart },
      },
    });

    return ok({
      stats: {
        totalUsers,
        activeUsers: users.filter((user) => user.lastLogin).length,
        totalOrders,
        completedOrders,
        failedOrders,
        totalRevenue,
        todayRevenue: todayRevenue._sum.finalPrice ?? 0,
        avgOrderValue: completedOrders ? Math.round(totalRevenue / completedOrders) : 0,
        conversionRate: totalUsers ? Math.round((totalOrders / totalUsers) * 1000) / 10 : 0,
        refundRate: totalOrders
          ? Math.round(((await prisma.order.count({ where: { status: 'REFUNDED' } })) / totalOrders) * 1000) / 10
          : 0,
      },
      users: users.map(mapUser),
      products: products.map(mapProduct),
      orders: orders.map(mapOrder),
      walletTransactions: walletTransactions.map(mapWalletTransaction),
      manualDeposits: manualDeposits.map(mapManualDeposit),
      providers: providerAccounts.map(mapProviderAccount),
      providerBalanceAlerts: providerBalanceAlerts.map(mapProviderBalanceAlert),
      promotions: promotions.map(mapPromotion),
      banners: banners.map(mapBanner),
      countries: countries.map((country) => {
        const exchangeRate = exchangeRates.find((rate) => (
          rate.baseCurrencyCode === BASE_CURRENCY &&
          rate.quoteCurrencyCode === country.currencyCode
        ));
        return mapCountry(country, exchangeRate, BASE_CURRENCY);
      }),
      exchangeRates: exchangeRates.map(mapExchangeRate),
      customPricingRules: customPricingRules.map(mapCustomPricingRule),
      providerRequests,
      whatsappNotifications: whatsappNotifications.map(mapWhatsAppNotification),
      auditLogs: auditLogs.map(mapAdminAuditLog),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
