import { destroySession } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await destroySession();
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
