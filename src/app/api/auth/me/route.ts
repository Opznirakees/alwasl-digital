import { assertUserNotBlocked, getCurrentUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapUser } from '@/server/mappers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    await assertUserNotBlocked(user);
    return ok({ user: user ? mapUser(user) : null });
  } catch (error) {
    return handleApiError(error);
  }
}
