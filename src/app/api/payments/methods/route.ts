import { ok } from '@/server/http';
import { isQiCardCheckoutEnabled } from '@/server/payments/qicard';

export const runtime = 'nodejs';

export async function GET() {
  const methods = [{ id: 'cash', enabled: true }];
  if (isQiCardCheckoutEnabled()) {
    methods.push({ id: 'qicard', enabled: true });
  }

  return ok({
    methods,
  });
}
