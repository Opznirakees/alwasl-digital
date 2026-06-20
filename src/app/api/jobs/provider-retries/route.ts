import { NextRequest } from 'next/server';
import { assertCronRequest } from '@/server/cron';
import { handleApiError, ok } from '@/server/http';
import { runDueProviderRetryJobs } from '@/server/services/provider-retry-runner';

export const runtime = 'nodejs';

function getLimit(request: NextRequest) {
  const value = request.nextUrl.searchParams.get('limit');
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function runProviderRetries(request: NextRequest) {
  try {
    assertCronRequest(request);
    const result = await runDueProviderRetryJobs({ limit: getLimit(request) });
    return ok({ result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  return runProviderRetries(request);
}

export async function POST(request: NextRequest) {
  return runProviderRetries(request);
}
