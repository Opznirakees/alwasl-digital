import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { assertRateLimit } from '@/server/rate-limit';
import { sendMarketingWhatsAppBatch } from '@/server/services/whatsapp-notifications';
import { marketingWhatsAppSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('WHATSAPP_MARKETING');
    const body = marketingWhatsAppSchema.parse(await request.json());

    await assertRateLimit(`admin:whatsapp-marketing:${admin.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });

    const result = await sendMarketingWhatsAppBatch(admin, body);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.whatsapp.marketing.send',
      entityType: 'whatsapp_marketing_batch',
      entityId: result.batchId,
      metadata: {
        target: body.target,
        recipients: result.recipients,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
      },
    });

    return ok(result, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}
