import { normalizeInternationalPhoneForWhatsApp } from '@/lib/phone';

export interface WahaEnv {
  WAHA_BASE_URL?: string;
  WAHA_API_KEY?: string;
  WAHA_SESSION?: string;
}

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface WahaClientOptions {
  env?: WahaEnv | NodeJS.ProcessEnv;
  fetcher?: Fetcher;
  onFailure?: (error: Error) => void;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface WahaHealthPayload {
  status?: string;
  state?: string;
  session?: {
    status?: string;
    state?: string;
  };
  engine?: {
    state?: string;
  };
}

export interface WahaHealth {
  healthy: boolean;
  status?: string;
  state?: string;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 250;

export function normalizeWhatsAppPhone(phone: string) {
  return normalizeInternationalPhoneForWhatsApp(phone);
}

function assertValidPhone(normalized: string) {
  if (!/^[1-9]\d{7,18}$/.test(normalized)) {
    throw new Error('WAHA_INVALID_PHONE');
  }
}

function toChatId(phone: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  assertValidPhone(normalized);
  return `${normalized}@c.us`;
}

export function validateWahaConfig(env: WahaEnv | NodeJS.ProcessEnv = process.env) {
  const baseUrl = env.WAHA_BASE_URL?.trim();
  const apiKey = env.WAHA_API_KEY?.trim();
  const session = env.WAHA_SESSION?.trim() || 'default';

  if (!baseUrl || !apiKey) {
    throw new Error('WAHA_NOT_CONFIGURED');
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    apiKey,
    session,
  };
}

function parseWahaHealth(payload: WahaHealthPayload): WahaHealth {
  const status = payload.status ?? payload.session?.status;
  const state = payload.state ?? payload.engine?.state ?? payload.session?.state;

  return {
    healthy: status === 'WORKING' || state === 'CONNECTED',
    status,
    state,
  };
}

function safeFailure(options: WahaClientOptions | undefined, error: Error) {
  try {
    options?.onFailure?.(error);
  } catch {
    // Failure hooks must never break the original request path.
  }
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function isTransientStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function wait(delayMs: number) {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function fetchWaha(
  input: string | URL,
  init: RequestInit,
  failureCode: string,
  options: WahaClientOptions
) {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const maxRetries = Math.max(0, options.maxRetries ?? DEFAULT_MAX_RETRIES);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetcher(input, {
        ...init,
        signal: controller.signal,
      });

      if (response.ok) return response;

      if (attempt < maxRetries && isTransientStatus(response.status)) {
        await wait(retryDelayMs);
        continue;
      }

      throw new Error(failureCode);
    } catch (error) {
      if (error instanceof Error && error.message === failureCode) throw error;

      const normalizedError = controller.signal.aborted
        ? new Error('WAHA_REQUEST_TIMEOUT')
        : new Error(failureCode);

      if (attempt >= maxRetries) throw normalizedError;
      await wait(retryDelayMs);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(failureCode);
}

export async function getWahaHealth(options: WahaClientOptions = {}) {
  const config = validateWahaConfig(options.env);

  const response = await fetchWaha(`${config.baseUrl}/api/sessions/${config.session}`, {
    headers: {
      'X-Api-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  }, 'WAHA_HEALTH_FAILED', options);

  return parseWahaHealth((await readJson(response)) as WahaHealthPayload);
}

export async function checkWhatsAppRecipient(phone: string, options: WahaClientOptions = {}) {
  const config = validateWahaConfig(options.env);
  const normalized = normalizeWhatsAppPhone(phone);
  assertValidPhone(normalized);

  const url = new URL('/api/contacts/check-exists', config.baseUrl);
  url.searchParams.set('phone', normalized);
  url.searchParams.set('session', config.session);

  const response = await fetchWaha(url, {
    headers: {
      'X-Api-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  }, 'WAHA_RECIPIENT_CHECK_FAILED', options);

  const payload = (await readJson(response)) as { numberExists?: boolean; exists?: boolean; result?: boolean };
  return {
    normalized,
    exists: payload.numberExists === true || payload.exists === true || payload.result === true,
  };
}

export async function sendWhatsAppText(phone: string, text: string, options: WahaClientOptions = {}) {
  const config = validateWahaConfig(options.env);
  const chatId = toChatId(phone);

  try {
    const health = await getWahaHealth(options);
    if (!health.healthy) {
      throw new Error('WAHA_SESSION_UNHEALTHY');
    }

    const recipient = await checkWhatsAppRecipient(phone, options);
    if (!recipient.exists) {
      throw new Error('WAHA_RECIPIENT_NOT_FOUND');
    }

    const payload = {
      chatId,
      reply_to: null,
      text,
      linkPreview: true,
      linkPreviewHighQuality: false,
      session: config.session,
    };

    const response = await fetchWaha(`${config.baseUrl}/api/sendText`, {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, 'WAHA_SEND_FAILED', options);

    const data = (await readJson(response)) as { id?: string; key?: { id?: string } };
    return {
      success: true,
      chatId,
      messageId: data.id ?? data.key?.id,
    };
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error('WAHA_SEND_FAILED');
    safeFailure(options, normalizedError);
    throw normalizedError;
  }
}
