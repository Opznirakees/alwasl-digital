import { cookies, headers } from 'next/headers';
import type { User } from '@prisma/client';
import { prisma } from './prisma';
import { createOpaqueToken, sha256 } from './crypto';
import { hasPermission, type StaffPermission } from './permissions';
import { getClientIpFromHeaders } from './domain/access-blocks';
import {
  assertAccessAllowed,
  assertRequestAccessAllowed,
} from './services/access-blocks';

export const SESSION_COOKIE = 'alwasl_session';
const SESSION_DAYS = 30;

function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = sessionExpiry();
  const headerStore = await headers();
  const ipAddress = getClientIpFromHeaders(headerStore);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt,
      ipAddress,
      userAgent: headerStore.get('user-agent'),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: sha256(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  return session?.user ?? null;
}

export async function assertPhoneNotBlocked(phone: string) {
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
  const user = await prisma.user.findFirst({
    where: { phone: { in: [phone, normalizedPhone] } },
    select: { isBlocked: true },
  });

  if (user?.isBlocked) throw new Error('USER_BLOCKED');
  await assertAccessAllowed({ phone });
}

export async function assertUserNotBlocked(user: Pick<User, 'id' | 'phone' | 'isBlocked'> | null) {
  if (!user) return;

  try {
    if (user.isBlocked) throw new Error('USER_BLOCKED');
    await assertRequestAccessAllowed(await headers(), { phone: user.phone });
  } catch (error) {
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    throw error;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  await assertUserNotBlocked(user);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN');
  return user;
}

export async function requirePermission(permission: StaffPermission) {
  const user = await requireUser();
  if (!hasPermission(user, permission)) throw new Error('FORBIDDEN');
  return user;
}
