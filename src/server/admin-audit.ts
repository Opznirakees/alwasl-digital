import type { Prisma, User } from '@prisma/client';
import { prisma } from './prisma';

type AuditUser = Pick<User, 'id' | 'role'>;

interface AdminAuditInput {
  admin: AuditUser;
  request?: Pick<Request, 'headers'>;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || undefined;
}

export function getAuditRequestContext(request?: Pick<Request, 'headers'>) {
  const headers = request?.headers;
  if (!headers) return {};

  return {
    ipAddress:
      firstHeaderValue(headers.get('x-forwarded-for')) ??
      firstHeaderValue(headers.get('cf-connecting-ip')) ??
      firstHeaderValue(headers.get('x-real-ip')),
    userAgent: headers.get('user-agent') ?? undefined,
  };
}

export function shouldAuditAdminUser(user: Pick<User, 'role'>) {
  return user.role === 'ADMIN' || user.role === 'STAFF';
}

export async function recordAdminAuditLog(input: AdminAuditInput) {
  if (!shouldAuditAdminUser(input.admin)) return;

  const { ipAddress, userAgent } = getAuditRequestContext(input.request);

  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: input.admin.id,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        metadata: input.metadata,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to record admin audit log', error);
  }
}
