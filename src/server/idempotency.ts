import { sha256 } from './crypto';

const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{8,128}$/;

type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike | undefined };

function stableJson(value: JsonLike): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key] as JsonLike)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function requireIdempotencyKey(headers: Pick<Headers, 'get'>) {
  const key = headers.get('idempotency-key')?.trim();
  if (!key) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  if (!idempotencyKeyPattern.test(key)) throw new Error('IDEMPOTENCY_KEY_INVALID');

  return key;
}

export function createIdempotencyFingerprint(scope: string, payload: JsonLike) {
  return sha256(`${scope}:${stableJson(payload)}`);
}

export function assertMatchingIdempotencyFingerprint(existing: string | null | undefined, incoming: string) {
  if (existing && existing !== incoming) {
    throw new Error('IDEMPOTENCY_KEY_REUSED');
  }
}
