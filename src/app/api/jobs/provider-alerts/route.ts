import { NextRequest } from 'next/server';
import { assertCronRequest } from '@/server/cron';
import { handleApiError, ok } from '@/server/http';
import { checkProviderLowBalanceAlerts } from '@/server/services/provider-balance-alerts';

export const runtime = 'nodejs';

async function runProviderAlerts(request: NextRequest) {
  try {
    assertCronRequest(request);
    const result = await checkProviderLowBalanceAlerts();
    return ok({ result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  return runProviderAlerts(request);
}

export async function POST(request: NextRequest) {
  return runProviderAlerts(request);
}
