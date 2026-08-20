import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import {
  createAccessBlock,
  listAccessBlocks,
} from '@/server/services/access-blocks';
import { createAdminAccessBlockSchema } from '@/server/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('USER_READ');
    return ok({ blocks: await listAccessBlocks() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('USER_MANAGE');
    const body = createAdminAccessBlockSchema.parse(await request.json());
    const block = await createAccessBlock(admin, {
      type: body.type,
      value: body.value,
      reason: body.reason,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notifyByWhatsApp: body.notifyByWhatsApp,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.access_block.create',
      entityType: 'access_block',
      entityId: block.id,
      metadata: {
        type: block.type,
        maskedValue: block.maskedValue,
        reason: block.reason,
        expiresAt: block.expiresAt,
        notificationRequested: block.notificationRequested,
        notificationStatus: block.notificationStatus,
      },
    });

    return ok({ block }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
