import { NextRequest } from 'next/server';
import { generatedContentCatalog } from '@/data/content-catalog.generated';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { prisma } from '@/server/prisma';
import { assertContentPlaceholdersPreserved } from '@/server/domain/content-overrides';
import {
  adminContentOverrideDeleteSchema,
  adminContentOverrideSchema,
} from '@/server/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('CONTENT_MANAGE');
    const overrides = await prisma.contentOverride.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
    const overridesByKey = new Map(overrides.map((override) => [override.key, override]));
    const catalogKeys = new Set(generatedContentCatalog.map((entry) => entry.key));
    const entries = generatedContentCatalog.map((entry) => ({
      ...entry,
      override: overridesByKey.get(entry.key) ?? null,
    }));

    for (const override of overrides) {
      if (!catalogKeys.has(override.key)) {
        entries.push({
          key: override.key,
          module: override.module,
          valueEn: override.valueEn,
          valueAr: override.valueAr,
          valueZh: override.valueZh,
          override,
        });
      }
    }

    return ok({ entries });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requirePermission('CONTENT_MANAGE');
    const body = adminContentOverrideSchema.parse(await request.json());
    const catalogEntry = generatedContentCatalog.find((entry) => entry.key === body.key);
    if (catalogEntry) {
      assertContentPlaceholdersPreserved(catalogEntry.valueEn, body.valueEn);
      assertContentPlaceholdersPreserved(catalogEntry.valueAr, body.valueAr);
      assertContentPlaceholdersPreserved(catalogEntry.valueZh, body.valueZh);
    }
    const override = await prisma.contentOverride.upsert({
      where: { key: body.key },
      update: {
        module: body.module,
        valueEn: body.valueEn,
        valueAr: body.valueAr,
        valueZh: body.valueZh,
        isActive: body.isActive,
        updatedByAdminId: admin.id,
      },
      create: {
        key: body.key,
        module: body.module,
        valueEn: body.valueEn,
        valueAr: body.valueAr,
        valueZh: body.valueZh,
        isActive: body.isActive,
        updatedByAdminId: admin.id,
      },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.content_override.upsert',
      entityType: 'content_override',
      entityId: override.id,
      metadata: {
        key: override.key,
        module: override.module,
        isActive: override.isActive,
      },
    });

    return ok({ override });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requirePermission('CONTENT_MANAGE');
    const body = adminContentOverrideDeleteSchema.parse(await request.json());
    const existing = await prisma.contentOverride.findUnique({ where: { key: body.key } });
    if (!existing) throw new Error('NOT_FOUND');

    await prisma.contentOverride.delete({ where: { key: body.key } });
    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.content_override.reset',
      entityType: 'content_override',
      entityId: existing.id,
      metadata: {
        key: existing.key,
        module: existing.module,
      },
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
