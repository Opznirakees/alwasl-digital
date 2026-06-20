import type { ProviderAccount } from '@prisma/client';
import { sha256 } from '../crypto';
import { sendWhatsAppText, validateWahaConfig } from './waha-whatsapp';

export interface WahoProviderEnv {
  NODE_ENV?: string;
  ENABLE_MOCK_WAHO?: string;
  WAHO_API_BASE_URL?: string;
  WAHO_FULFILLMENT_PHONE?: string;
  WAHA_BASE_URL?: string;
  WAHA_API_KEY?: string;
  WAHA_SESSION?: string;
}

export interface WahoAccountVerification {
  valid: boolean;
  wahoId: string;
  username?: string;
}

export interface WahoTopupInput {
  orderId: string;
  wahoId: string;
  amount: number;
  paidAmount?: number;
  currency: string;
  packageName?: string;
}

export interface WahoTopupResult {
  providerId: string;
  providerOrderId: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface WahoProvider {
  verifyWahoAccount(wahoId: string): Promise<WahoAccountVerification>;
  createWahoTopup(input: WahoTopupInput): Promise<WahoTopupResult>;
  getWahoTopupStatus(providerOrderId: string): Promise<WahoTopupResult['status']>;
}

const MOCK_WAHO_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{3,31}$/;

class MockWahoProvider implements WahoProvider {
  async verifyWahoAccount(wahoId: string): Promise<WahoAccountVerification> {
    const normalized = wahoId.trim();
    const suffix = sha256(normalized).slice(0, 5).toUpperCase();
    const valid = MOCK_WAHO_ID_PATTERN.test(normalized);

    return {
      valid,
      wahoId: normalized,
      username: valid ? `WAHO-${suffix}` : undefined,
    };
  }

  async createWahoTopup(input: WahoTopupInput): Promise<WahoTopupResult> {
    return {
      providerId: 'waho-mock-provider',
      providerOrderId: `WAHO-MOCK-${sha256(`${input.orderId}:${input.wahoId}:${input.amount}`).slice(0, 12).toUpperCase()}`,
      status: 'processing',
    };
  }

  async getWahoTopupStatus(): Promise<WahoTopupResult['status']> {
    return 'processing';
  }
}

class UnconfiguredWahoProvider implements WahoProvider {
  async verifyWahoAccount(): Promise<WahoAccountVerification> {
    throw new Error('WAHO_PROVIDER_NOT_CONFIGURED');
  }

  async createWahoTopup(): Promise<WahoTopupResult> {
    throw new Error('WAHO_PROVIDER_NOT_CONFIGURED');
  }

  async getWahoTopupStatus(): Promise<WahoTopupResult['status']> {
    throw new Error('WAHO_PROVIDER_NOT_CONFIGURED');
  }
}

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat('en-IQ').format(Math.round(amount))} ${currency}`;
}

function createFulfillmentMessage(input: WahoTopupInput) {
  return [
    'WAHO top-up fulfillment request',
    '',
    `Order ID: ${input.orderId}`,
    `WAHO ID: ${input.wahoId}`,
    input.packageName ? `Package: ${input.packageName}` : undefined,
    `Top-up amount: ${formatAmount(input.amount, input.currency)}`,
    input.paidAmount !== undefined ? `Paid amount: ${formatAmount(input.paidAmount, input.currency)}` : undefined,
    '',
    'Please fulfill this WAHO top-up and keep the order in processing until it is confirmed.',
  ]
    .filter(Boolean)
    .join('\n');
}

class WahaWhatsAppWahoProvider implements WahoProvider {
  constructor(private readonly env: WahoProviderEnv = process.env) {}

  async verifyWahoAccount(wahoId: string): Promise<WahoAccountVerification> {
    const normalized = wahoId.trim();
    const suffix = sha256(normalized).slice(0, 5).toUpperCase();
    const valid = MOCK_WAHO_ID_PATTERN.test(normalized);

    return {
      valid,
      wahoId: normalized,
      username: valid ? `WAHO-${suffix}` : undefined,
    };
  }

  async createWahoTopup(input: WahoTopupInput): Promise<WahoTopupResult> {
    const fulfillmentPhone = this.env.WAHO_FULFILLMENT_PHONE?.trim();
    if (!fulfillmentPhone) throw new Error('WAHA_NOT_CONFIGURED');

    const result = await sendWhatsAppText(fulfillmentPhone, createFulfillmentMessage(input), {
      env: this.env,
      onFailure: (error) => {
        console.warn('WAHA fulfillment notification failed', {
          orderId: input.orderId,
          code: error.message,
        });
      },
    });

    return {
      providerId: 'waha-whatsapp-fulfillment',
      providerOrderId: result.messageId ? `WAHA-${result.messageId}` : `WAHA-${sha256(`${input.orderId}:${input.wahoId}`).slice(0, 12).toUpperCase()}`,
      status: 'processing',
    };
  }

  async getWahoTopupStatus(): Promise<WahoTopupResult['status']> {
    return 'processing';
  }
}

type AccountConfig = Record<string, unknown>;

function readAccountConfig(account: ProviderAccount): AccountConfig {
  if (!account.config || typeof account.config !== 'object' || Array.isArray(account.config)) {
    return {};
  }

  return account.config as AccountConfig;
}

function configString(config: AccountConfig, key: string) {
  const value = config[key];
  return typeof value === 'string' ? value.trim() : undefined;
}

function configEnvValue(config: AccountConfig, valueKey: string, envKey: string, fallbackEnvKey: string) {
  const directValue = configString(config, valueKey);
  if (directValue) return directValue;

  const configuredEnvKey = configString(config, envKey) || fallbackEnvKey;
  return process.env[configuredEnvKey]?.trim();
}

function createAccountEnv(account: ProviderAccount): WahoProviderEnv {
  const config = readAccountConfig(account);

  return {
    NODE_ENV: process.env.NODE_ENV,
    ENABLE_MOCK_WAHO: account.type === 'MOCK' ? 'true' : process.env.ENABLE_MOCK_WAHO,
    WAHO_API_BASE_URL: configEnvValue(config, 'wahoApiBaseUrl', 'wahoApiBaseUrlEnv', 'WAHO_API_BASE_URL'),
    WAHO_FULFILLMENT_PHONE: configEnvValue(
      config,
      'wahoFulfillmentPhone',
      'wahoFulfillmentPhoneEnv',
      'WAHO_FULFILLMENT_PHONE'
    ),
    WAHA_BASE_URL: configEnvValue(config, 'wahaBaseUrl', 'wahaBaseUrlEnv', 'WAHA_BASE_URL'),
    WAHA_API_KEY: configEnvValue(config, 'wahaApiKey', 'wahaApiKeyEnv', 'WAHA_API_KEY'),
    WAHA_SESSION: configEnvValue(config, 'wahaSession', 'wahaSessionEnv', 'WAHA_SESSION') || 'default',
  };
}

export function isMockWahoEnabled(env: WahoProviderEnv = process.env) {
  return env.NODE_ENV !== 'production' && env.ENABLE_MOCK_WAHO === 'true';
}

export function isWahaWahoProviderEnabled(env: WahoProviderEnv = process.env) {
  if (!env.WAHO_FULFILLMENT_PHONE?.trim()) return false;

  try {
    validateWahaConfig(env);
    return true;
  } catch {
    return false;
  }
}

export function getWahoProvider(env: WahoProviderEnv = process.env): WahoProvider {
  if (isMockWahoEnabled(env)) {
    return new MockWahoProvider();
  }

  if (isWahaWahoProviderEnabled(env)) {
    return new WahaWhatsAppWahoProvider(env);
  }

  return new UnconfiguredWahoProvider();
}

export function getWahoProviderForAccount(account: ProviderAccount): WahoProvider {
  if (account.type === 'MOCK') {
    return getWahoProvider(createAccountEnv(account));
  }

  if (account.type === 'WAHA_WHATSAPP') {
    return new WahaWhatsAppWahoProvider(createAccountEnv(account));
  }

  return new UnconfiguredWahoProvider();
}

export function getWahoProviderInfo(env: WahoProviderEnv = process.env) {
  if (isMockWahoEnabled(env)) {
    return {
      id: 'waho-mock-provider',
      name: 'WAHO Local Mock Provider',
      apiEndpoint: 'mock://waho-local',
      isActive: true,
      status: 'degraded' as const,
    };
  }

  if (isWahaWahoProviderEnabled(env)) {
    return {
      id: 'waha-whatsapp-fulfillment',
      name: 'WAHA WhatsApp Fulfillment',
      apiEndpoint: 'waha://api/sendText',
      isActive: true,
      status: 'degraded' as const,
    };
  }

  return {
    id: 'waho-api',
    name: 'WAHO API',
    apiEndpoint: env.WAHO_API_BASE_URL || 'not-configured',
    isActive: false,
    status: 'offline' as const,
  };
}
