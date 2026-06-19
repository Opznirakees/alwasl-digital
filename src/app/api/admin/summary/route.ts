import { requireAdmin } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder, mapProduct, mapUser, mapWalletTransaction } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { getWahoProviderInfo } from '@/server/providers/waho';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdmin();

    const [
      users,
      products,
      orders,
      walletTransactions,
      providerRequests,
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
      prisma.providerRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
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

    const failedProviderRequests = providerRequests.filter((request) => request.status === 'FAILED').length;
    const providerSuccessRate = providerRequests.length
      ? Math.round(((providerRequests.length - failedProviderRequests) / providerRequests.length) * 1000) / 10
      : 100;
    const wahoProvider = getWahoProviderInfo();

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
      providers: [
        {
          ...wahoProvider,
          priority: 1,
          supportedGames: ['waho-top-up'],
          successRate: wahoProvider.isActive ? providerSuccessRate : 0,
          avgResponseTime: 0.2,
          lastHealthCheck: new Date().toISOString(),
          status: wahoProvider.isActive && failedProviderRequests ? 'degraded' : wahoProvider.status,
        },
      ],
      providerRequests,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
