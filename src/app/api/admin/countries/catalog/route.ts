import { countryCatalog } from '@/data/country-catalog';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requirePermission('CURRENCY_MANAGE');
    return ok({ countries: countryCatalog });
  } catch (error) {
    return handleApiError(error);
  }
}
