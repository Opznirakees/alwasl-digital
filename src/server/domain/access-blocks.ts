import { isIP } from 'node:net';
import { normalizeInternationalPhoneForWhatsApp } from '@/lib/phone';

export type AccessBlockType = 'WHATSAPP' | 'WAHO_ID' | 'IP_ADDRESS';

interface AccessBlockState {
  isActive: boolean;
  revokedAt: Date | null;
  expiresAt: Date | null;
}

function normalizeIpAddress(value: string) {
  let normalized = value.trim().toLowerCase();
  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    normalized = normalized.slice(1, -1);
  }
  if (normalized.startsWith('::ffff:') && isIP(normalized.slice(7)) === 4) {
    normalized = normalized.slice(7);
  }

  if (!isIP(normalized)) throw new Error('INVALID_BLOCK_VALUE');
  return normalized;
}

export function normalizeAccessBlockValue(type: AccessBlockType, value: string) {
  if (type === 'WHATSAPP') {
    const normalized = normalizeInternationalPhoneForWhatsApp(value);
    if (!/^[1-9]\d{7,18}$/.test(normalized)) throw new Error('INVALID_BLOCK_VALUE');
    return normalized;
  }

  if (type === 'WAHO_ID') {
    const normalized = value.trim().toLocaleLowerCase('en-US');
    if (!/^[a-z0-9][a-z0-9._-]{2,119}$/.test(normalized)) {
      throw new Error('INVALID_BLOCK_VALUE');
    }
    return normalized;
  }

  return normalizeIpAddress(value);
}

export function maskAccessBlockValue(type: AccessBlockType, normalizedValue: string) {
  if (type === 'WHATSAPP') {
    const visible = normalizedValue.slice(-4);
    return `${'*'.repeat(Math.max(4, normalizedValue.length - visible.length))}${visible}`;
  }

  if (type === 'WAHO_ID') {
    if (normalizedValue.length <= 6) return `${normalizedValue.slice(0, 1)}***${normalizedValue.slice(-1)}`;
    return `${normalizedValue.slice(0, 3)}${'*'.repeat(normalizedValue.length - 6)}${normalizedValue.slice(-3)}`;
  }

  if (normalizedValue.includes(':')) {
    const prefix = normalizedValue.split(':').slice(0, 2).filter(Boolean).join(':');
    return `${prefix || normalizedValue.slice(0, 4)}:…`;
  }

  const octets = normalizedValue.split('.');
  return octets.length === 4 ? `${octets[0]}.${octets[1]}.*.*` : 'masked-ip';
}

export function isAccessBlockActive(block: AccessBlockState, now = new Date()) {
  if (!block.isActive || block.revokedAt) return false;
  return !block.expiresAt || block.expiresAt > now;
}

export function getClientIpFromHeaders(headers: Pick<Headers, 'get'>) {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0],
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      return normalizeAccessBlockValue('IP_ADDRESS', candidate);
    } catch {
      continue;
    }
  }

  return undefined;
}
