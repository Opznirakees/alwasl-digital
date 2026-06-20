interface WahaEnv {
  WAHA_BASE_URL?: string;
  WAHA_API_KEY?: string;
  WAHA_SESSION?: string;
}

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface WahaClientOptions {
  env?: WahaEnv | NodeJS.ProcessEnv;
  fetcher?: Fetcher;
  onFailure?: (error: Error) => void;
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

export function normalizeWhatsAppPhone(phone: string) {
  let normalized = phone.replace(/\D/g, '');

  if (normalized.startsWith('00')) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith('31')) return normalized;

  if (normalized.startsWith('0')) {
    if (normalized.startsWith('07') && normalized.length >= 10) {
      return `964${normalized.slice(1)}`;
    }

    return `31${normalized.slice(1)}`;
  }

  return normalized;
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

export async function getWahaHealth(options: WahaClientOptions = {}) {
  const config = validateWahaConfig(options.env);
  const fetcher = options.fetcher ?? fetch;

  const response = await fetcher(`${config.baseUrl}/api/sessions/${config.session}`, {
    headers: {
      'X-Api-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('WAHA_HEALTH_FAILED');
  }

  return parseWahaHealth((await readJson(response)) as WahaHealthPayload);
}

export async function checkWhatsAppRecipient(phone: string, options: WahaClientOptions = {}) {
  const config = validateWahaConfig(options.env);
  const fetcher = options.fetcher ?? fetch;
  const normalized = normalizeWhatsAppPhone(phone);
  assertValidPhone(normalized);

  const url = new URL('/api/contacts/check-exists', config.baseUrl);
  url.searchParams.set('phone', normalized);
  url.searchParams.set('session', config.session);

  const response = await fetcher(url.toString(), {
    headers: {
      'X-Api-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('WAHA_RECIPIENT_CHECK_FAILED');
  }

  const payload = (await readJson(response)) as { numberExists?: boolean; exists?: boolean; result?: boolean };
  return {
    normalized,
    exists: payload.numberExists === true || payload.exists === true || payload.result === true,
  };
}

export async function sendWhatsAppText(phone: string, text: string, options: WahaClientOptions = {}) {
  const config = validateWahaConfig(options.env);
  const fetcher = options.fetcher ?? fetch;
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

    const response = await fetcher(`${config.baseUrl}/api/sendText`, {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('WAHA_SEND_FAILED');
    }

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
