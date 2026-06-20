import { NextRequest } from 'next/server';
import { assertCronRequest } from '@/server/cron';
import { handleApiError, ok } from '@/server/http';
import { pruneMonitoringEvents } from '@/server/services/monitoring';

export const runtime = 'nodejs';

async function runLogRetentionJob(request: NextRequest) {
  try {
    assertCronRequest(request);
    const result = await pruneMonitoringEvents();
    return ok({ result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  return runLogRetentionJob(request);
}

export async function POST(request: NextRequest) {
  return runLogRetentionJob(request);
}
