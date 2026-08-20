import { ok } from '@/server/http';
import { isQiCardCheckoutEnabled, resolveQiCardConfig } from '@/server/payments/qicard';

export const runtime = 'nodejs';

export async function GET() {
  const qiCardEnabled = isQiCardCheckoutEnabled();
  const qiCardEnvironment = qiCardEnabled ? resolveQiCardConfig().environment : null;

  return ok({
    methods: [
      { id: 'wallet', enabled: true },
      { id: 'qicard', enabled: qiCardEnabled, environment: qiCardEnvironment },
    ],
  });
}
