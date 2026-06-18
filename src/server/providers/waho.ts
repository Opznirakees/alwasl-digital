import { sha256 } from '../crypto';

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

class MockWahoProvider implements WahoProvider {
  async verifyWahoAccount(wahoId: string): Promise<WahoAccountVerification> {
    const normalized = wahoId.trim();
    const suffix = sha256(normalized).slice(0, 5).toUpperCase();

    return {
      valid: normalized.length >= 3,
      wahoId: normalized,
      username: `WAHO-${suffix}`,
    };
  }

  async createWahoTopup(input: WahoTopupInput): Promise<WahoTopupResult> {
    return {
      providerId: 'waho-mock-provider',
      providerOrderId: `WAHO-MOCK-${sha256(`${input.orderId}:${input.wahoId}:${input.amount}`).slice(0, 12).toUpperCase()}`,
      status: 'completed',
    };
  }

  async getWahoTopupStatus(): Promise<WahoTopupResult['status']> {
    return 'completed';
  }
}

export function getWahoProvider(): WahoProvider {
  // The adapter boundary is intentionally stable. When WAHO provides the real API,
  // replace this implementation without touching checkout/order orchestration.
  return new MockWahoProvider();
}
