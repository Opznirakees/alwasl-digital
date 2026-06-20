import type { Prisma, ProviderRetryJobType } from '@prisma/client';
import { nextProviderRetryAt, PROVIDER_RETRY_MAX_ATTEMPTS } from '../domain/provider-retry';

const activeRetryStatuses = ['PENDING', 'RUNNING'] as const;

interface ScheduleProviderRetryJobInput {
  orderId: string;
  providerAccountId?: string | null;
  type: ProviderRetryJobType;
  payload: Prisma.InputJsonValue;
  lastError?: string;
  nextRunAt?: Date;
  maxAttempts?: number;
}

export async function scheduleProviderRetryJob(
  tx: Prisma.TransactionClient,
  input: ScheduleProviderRetryJobInput
) {
  const existingJob = await tx.providerRetryJob.findFirst({
    where: {
      orderId: input.orderId,
      type: input.type,
      status: { in: [...activeRetryStatuses] },
    },
    orderBy: { nextRunAt: 'asc' },
  });

  if (existingJob) return existingJob;

  return tx.providerRetryJob.create({
    data: {
      orderId: input.orderId,
      providerAccountId: input.providerAccountId ?? undefined,
      type: input.type,
      status: 'PENDING',
      attemptCount: 0,
      maxAttempts: input.maxAttempts ?? PROVIDER_RETRY_MAX_ATTEMPTS,
      nextRunAt: input.nextRunAt ?? nextProviderRetryAt(),
      lastError: input.lastError,
      payload: input.payload,
    },
  });
}
