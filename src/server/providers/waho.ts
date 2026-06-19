import { sha256 } from '../crypto';

interface WahoProviderEnv {
  NODE_ENV?: string;
  ENABLE_MOCK_WAHO?: string;
  WAHO_API_BASE_URL?: string;
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
  currency: string;
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

export function isMockWahoEnabled(env: WahoProviderEnv = process.env) {
  return env.NODE_ENV !== 'production' && env.ENABLE_MOCK_WAHO === 'true';
}

export function getWahoProvider(env: WahoProviderEnv = process.env): WahoProvider {
  if (isMockWahoEnabled(env)) {
    return new MockWahoProvider();
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

  return {
    id: 'waho-api',
    name: 'WAHO API',
    apiEndpoint: env.WAHO_API_BASE_URL || 'not-configured',
    isActive: false,
    status: 'offline' as const,
  };
}
