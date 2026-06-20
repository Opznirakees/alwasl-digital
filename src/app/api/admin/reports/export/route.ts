import { NextRequest, NextResponse } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { createExcelWorkbookBuffer, type ExcelExportRow } from '@/server/excel-export';
import { handleApiError } from '@/server/http';
import { buildReport } from '@/server/services/reports';
import { adminReportExportSchema } from '@/server/validation';

export const runtime = 'nodejs';

function reportRows(report: Awaited<ReturnType<typeof buildReport>>): ExcelExportRow[] {
  const summaryRows: ExcelExportRow[] = [
    {
      rowType: 'summary',
      period: report.period,
      label: 'Total',
      from: report.from,
      to: report.to,
      orders: report.summary.orders,
      completedOrders: report.summary.completedOrders,
      failedOrders: report.summary.failedOrders,
      refundedOrders: report.summary.refundedOrders,
      revenue: report.summary.revenue,
      walletRevenue: report.summary.walletRevenue,
      externalPaymentRevenue: report.summary.externalPaymentRevenue,
      manualDeposits: report.summary.manualDeposits,
      manualDepositAmount: report.summary.manualDepositAmount,
      newUsers: report.summary.newUsers,
      avgOrderValue: report.summary.avgOrderValue,
      conversionRate: report.summary.conversionRate,
      refundRate: report.summary.refundRate,
    },
  ];

  return [
    ...summaryRows,
    ...report.buckets.map((bucket) => ({
      rowType: 'bucket',
      period: report.period,
      label: bucket.label,
      from: bucket.start,
      to: bucket.end,
      orders: bucket.orders,
      completedOrders: bucket.completedOrders,
      failedOrders: bucket.failedOrders,
      refundedOrders: bucket.refundedOrders,
      revenue: bucket.revenue,
      walletRevenue: bucket.walletRevenue,
      externalPaymentRevenue: bucket.externalPaymentRevenue,
      manualDeposits: bucket.manualDeposits,
      manualDepositAmount: bucket.manualDepositAmount,
      newUsers: bucket.newUsers,
      avgOrderValue: bucket.completedOrders ? Math.round(bucket.revenue / bucket.completedOrders) : 0,
      conversionRate: bucket.orders ? Math.round((bucket.completedOrders / bucket.orders) * 1000) / 10 : 0,
      refundRate: bucket.orders ? Math.round((bucket.refundedOrders / bucket.orders) * 1000) / 10 : 0,
    })),
  ];
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('EXPORT_DATA');
    const query = adminReportExportSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const report = await buildReport(query);
    const rows = reportRows(report);
    const buffer = await createExcelWorkbookBuffer({
      sheetName: `${report.period}-report`,
      rows,
    });
    const stamp = new Date().toISOString().slice(0, 10);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.report.export',
      entityType: 'admin_report',
      entityId: report.period,
      metadata: {
        period: report.period,
        from: report.from,
        to: report.to,
        rows: rows.length,
      },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="alwasl-report-${report.period}-${stamp}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
