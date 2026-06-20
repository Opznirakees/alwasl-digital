import type { Prisma, ProviderAccount, ProviderRetryJob } from '@prisma/client';
import { hasProviderRetryAttemptsRemaining, nextProviderRetryAt } from '../domain/provider-retry';
import { prisma } from '../prisma';
import {
  getWahoProvider,
  getWahoProviderForAccount,
  type WahoTopupInput,
} from '../providers/waho';
import {
  createWahoTopupWithFailover,
  isWahoProviderFailoverError,
  type WahoProviderAttempt,
} from '../providers/waho-router';
import { scheduleProviderRetryJob } from './provider-retry-jobs';
import { refundPaidOrder } from './orders';
import { notifyTopupSuccessForOrder } from './whatsapp-notifications';

interface ProviderRetryPayload {
  productSlug: string;
  providerInput: WahoTopupInput;
  providerId?: string;
  providerOrderId?: string;
}

interface ProviderRetryRunOptions {
  limit?: number;
  now?: Date;
}

interface ProviderRetryRunResult {
  claimed: number;
  completed: number;
  rescheduled: number;
  failed: number;
  refunded: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('PROVIDER_RETRY_PAYLOAD_INVALID');
  return value as Record<string, unknown>;
}

function parseProviderInput(value: unknown): WahoTopupInput {
  const input = asRecord(value);

  if (
    typeof input.orderId !== 'string' ||
    typeof input.wahoId !== 'string' ||
    typeof input.amount !== 'number' ||
    typeof input.currency !== 'string'
  ) {
    throw new Error('PROVIDER_RETRY_PAYLOAD_INVALID');
  }

  return {
    orderId: input.orderId,
    wahoId: input.wahoId,
    amount: input.amount,
    paidAmount: typeof input.paidAmount === 'number' ? input.paidAmount : undefined,
    currency: input.currency,
    packageName: typeof input.packageName === 'string' ? input.packageName : undefined,
  };
}

function parseRetryPayload(payload: Prisma.JsonValue): ProviderRetryPayload {
  const data = asRecord(payload);
  if (typeof data.productSlug !== 'string') throw new Error('PROVIDER_RETRY_PAYLOAD_INVALID');

  return {
    productSlug: data.productSlug,
    providerInput: parseProviderInput(data.providerInput),
    providerId: typeof data.providerId === 'string' ? data.providerId : undefined,
    providerOrderId: typeof data.providerOrderId === 'string' ? data.providerOrderId : undefined,
  };
}

function createWahoTopupJson(input: WahoTopupInput): Prisma.InputJsonValue {
  return {
    orderId: input.orderId,
    wahoId: input.wahoId,
    amount: input.amount,
    paidAmount: input.paidAmount ?? null,
    currency: input.currency,
    packageName: input.packageName ?? null,
  };
}

function providerResultJson(providerResult: { providerId: string; providerOrderId: string; status: string }): Prisma.InputJsonValue {
  return {
    providerId: providerResult.providerId,
    providerOrderId: providerResult.providerOrderId,
    status: providerResult.status,
  };
}

function fallbackProviderAttempt(error: unknown): WahoProviderAttempt {
  return {
    provider: 'waho-provider',
    action: 'createWahoTopup',
    status: 'FAILED',
    error: error instanceof Error ? error.message : 'WAHO_PROVIDER_ERROR',
  };
}

async function claimDueRetryJobs(limit: number, now: Date) {
  return prisma.$queryRaw<ProviderRetryJob[]>`
    UPDATE "provider_retry_jobs"
    SET
      "status" = 'RUNNING'::"ProviderRetryJobStatus",
      "attemptCount" = "attemptCount" + 1,
      "lastRunAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" IN (
      SELECT "id"
      FROM "provider_retry_jobs"
      WHERE "status" = 'PENDING'::"ProviderRetryJobStatus"
        AND "nextRunAt" <= ${now}
        AND "attemptCount" < "maxAttempts"
      ORDER BY "nextRunAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `;
}

async function logProviderAttempts(orderId: string, requestPayload: Prisma.InputJsonValue, attempts: WahoProviderAttempt[]) {
  for (const attempt of attempts) {
    await prisma.providerRequest.create({
      data: {
        orderId,
        providerAccountId: attempt.providerAccountId,
        provider: attempt.provider,
        action: attempt.action,
        status: attempt.status,
        providerOrderId: attempt.providerOrderId,
        requestPayload,
        responsePayload: attempt.responsePayload,
        error: attempt.error,
      },
    });
  }
}

async function rescheduleJob(job: ProviderRetryJob, lastError: string) {
  await prisma.providerRetryJob.update({
    where: { id: job.id },
    data: {
      status: 'PENDING',
      nextRunAt: nextProviderRetryAt(),
      lastError,
    },
  });
}

async function completeJob(job: ProviderRetryJob, resultPayload?: Prisma.InputJsonValue) {
  await prisma.providerRetryJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      resultPayload,
    },
  });
}

async function failJob(job: ProviderRetryJob, lastError: string, resultPayload?: Prisma.InputJsonValue) {
  await prisma.providerRetryJob.update({
    where: { id: job.id },
    data: {
      status: 'FAILED',
      failedAt: new Date(),
      lastError,
      resultPayload,
    },
  });
}

function getRetryFailureAttempts(error: unknown) {
  return isWahoProviderFailoverError(error) && error.attempts.length
    ? error.attempts
    : [fallbackProviderAttempt(error)];
}

function attemptsToRefundRequests(attempts: WahoProviderAttempt[], requestPayload: Prisma.InputJsonValue) {
  return attempts.map((attempt) => ({
    provider: attempt.provider,
    providerAccountId: attempt.providerAccountId,
    action: attempt.action,
    providerOrderId: attempt.providerOrderId,
    requestPayload,
    responsePayload: attempt.responsePayload,
    error: attempt.error,
  }));
}

async function safeWhatsAppNotification(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.error('Failed to queue WhatsApp notification', error);
  }
}

async function refundAfterRetryExhaustion(
  job: ProviderRetryJob,
  attempts: WahoProviderAttempt[],
  requestPayload: Prisma.InputJsonValue
) {
  const order = await refundPaidOrder(job.orderId, {
    reason: 'Provider fulfillment failed after retry exhaustion',
    providerRequests: attemptsToRefundRequests(attempts, requestPayload),
  });

  await failJob(job, 'PROVIDER_RETRY_EXHAUSTED', {
    orderId: order.id,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
  });
}

async function handleCreateTopupJob(job: ProviderRetryJob) {
  const payload = parseRetryPayload(job.payload);
  const requestPayload = createWahoTopupJson(payload.providerInput);

  try {
    const fulfillment = await createWahoTopupWithFailover(payload.providerInput, {
      productSlug: payload.productSlug,
    });
    await logProviderAttempts(job.orderId, requestPayload, fulfillment.attempts);

    const providerResult = fulfillment.result;
    if (providerResult.status === 'failed') {
      const attempts = fulfillment.attempts.length
        ? fulfillment.attempts
        : [{
            provider: providerResult.providerId,
            providerAccountId: fulfillment.account?.id,
            action: 'createWahoTopup' as const,
            status: 'FAILED' as const,
            providerOrderId: providerResult.providerOrderId,
            responsePayload: {
              providerId: providerResult.providerId,
              providerOrderId: providerResult.providerOrderId,
              status: providerResult.status,
            },
            error: 'WAHO_PROVIDER_FAILED',
          }];

      if (hasProviderRetryAttemptsRemaining(job.attemptCount, job.maxAttempts)) {
        await rescheduleJob(job, 'WAHO_PROVIDER_FAILED');
        return 'rescheduled' as const;
      }

      await refundAfterRetryExhaustion(job, attempts, requestPayload);
      return 'refunded' as const;
    }

    if (providerResult.status === 'processing') {
      await prisma.$transaction(async (tx) => {
        await scheduleProviderRetryJob(tx, {
          orderId: job.orderId,
          providerAccountId: fulfillment.account?.id,
          type: 'STATUS_POLL',
          payload: {
            productSlug: payload.productSlug,
            providerInput: createWahoTopupJson(payload.providerInput),
            providerId: providerResult.providerId,
            providerOrderId: providerResult.providerOrderId,
          },
          lastError: 'Provider status is still processing',
        });

        await tx.order.update({
          where: { id: job.orderId },
          data: {
            status: 'PROCESSING',
            paymentStatus: 'COMPLETED',
            providerId: providerResult.providerId,
            providerOrderId: providerResult.providerOrderId,
          },
        });
      });
      await completeJob(job, { providerResult: providerResultJson(providerResult) });
      return 'completed' as const;
    }

    const completedOrder = await prisma.order.update({
      where: { id: job.orderId },
      data: {
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        providerId: providerResult.providerId,
        providerOrderId: providerResult.providerOrderId,
        completedAt: new Date(),
      },
    });
    await completeJob(job, { providerResult: providerResultJson(providerResult) });
    await safeWhatsAppNotification(() => notifyTopupSuccessForOrder(completedOrder.id));
    return 'completed' as const;
  } catch (error) {
    const attempts = getRetryFailureAttempts(error);
    await logProviderAttempts(job.orderId, requestPayload, attempts);

    if (hasProviderRetryAttemptsRemaining(job.attemptCount, job.maxAttempts)) {
      await rescheduleJob(job, attempts.at(-1)?.error ?? 'WAHO_PROVIDER_RETRY_FAILED');
      return 'rescheduled' as const;
    }

    await refundAfterRetryExhaustion(job, attempts, requestPayload);
    return 'refunded' as const;
  }
}

async function getStatusProvider(job: ProviderRetryJob) {
  if (!job.providerAccountId) return getWahoProvider();

  const account = await prisma.providerAccount.findUnique({ where: { id: job.providerAccountId } });
  return account ? getWahoProviderForAccount(account as ProviderAccount) : getWahoProvider();
}

async function handleStatusPollJob(job: ProviderRetryJob) {
  const payload = parseRetryPayload(job.payload);
  if (!payload.providerOrderId) throw new Error('PROVIDER_RETRY_PAYLOAD_INVALID');

  const provider = await getStatusProvider(job);
  const status = await provider.getWahoTopupStatus(payload.providerOrderId);

  await prisma.providerRequest.create({
    data: {
      orderId: job.orderId,
      providerAccountId: job.providerAccountId,
      provider: payload.providerId ?? 'waho-provider',
      action: 'getWahoTopupStatus',
      status: status === 'failed' ? 'FAILED' : 'SUCCESS',
      providerOrderId: payload.providerOrderId,
      requestPayload: {
        providerOrderId: payload.providerOrderId,
      },
      responsePayload: {
        status,
      },
      error: status === 'failed' ? 'WAHO_STATUS_FAILED' : undefined,
    },
  });

  if (status === 'completed') {
    const completedOrder = await prisma.order.update({
      where: { id: job.orderId },
      data: {
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    await completeJob(job, { status });
    await safeWhatsAppNotification(() => notifyTopupSuccessForOrder(completedOrder.id));
    return 'completed' as const;
  }

  if (status === 'failed') {
    const attempt: WahoProviderAttempt = {
      provider: payload.providerId ?? 'waho-provider',
      providerAccountId: job.providerAccountId ?? undefined,
      action: 'createWahoTopup',
      status: 'FAILED',
      providerOrderId: payload.providerOrderId,
      responsePayload: { status },
      error: 'WAHO_STATUS_FAILED',
    };
    const requestPayload = createWahoTopupJson(payload.providerInput);

    if (hasProviderRetryAttemptsRemaining(job.attemptCount, job.maxAttempts)) {
      await rescheduleJob(job, 'WAHO_STATUS_FAILED');
      return 'rescheduled' as const;
    }

    await refundAfterRetryExhaustion(job, [attempt], requestPayload);
    return 'refunded' as const;
  }

  if (hasProviderRetryAttemptsRemaining(job.attemptCount, job.maxAttempts)) {
    await rescheduleJob(job, 'Provider status is still processing');
    return 'rescheduled' as const;
  }

  await failJob(job, 'STATUS_POLL_TIMEOUT', { status });
  return 'failed' as const;
}

async function runProviderRetryJob(job: ProviderRetryJob) {
  if (job.type === 'CREATE_TOPUP') return handleCreateTopupJob(job);
  return handleStatusPollJob(job);
}

export async function runDueProviderRetryJobs(options: ProviderRetryRunOptions = {}): Promise<ProviderRetryRunResult> {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);
  const jobs = await claimDueRetryJobs(limit, options.now ?? new Date());
  const result: ProviderRetryRunResult = {
    claimed: jobs.length,
    completed: 0,
    rescheduled: 0,
    failed: 0,
    refunded: 0,
  };

  for (const job of jobs) {
    try {
      const outcome = await runProviderRetryJob(job);
      result[outcome] += 1;
    } catch (error) {
      const lastError = error instanceof Error ? error.message : 'PROVIDER_RETRY_JOB_FAILED';

      if (hasProviderRetryAttemptsRemaining(job.attemptCount, job.maxAttempts)) {
        await rescheduleJob(job, lastError);
        result.rescheduled += 1;
      } else {
        await failJob(job, lastError);
        result.failed += 1;
      }
    }
  }

  return result;
}
