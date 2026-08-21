export type FulfillmentMode = 'WAHO_API' | 'MANUAL_CODE' | 'MANUAL_TOPUP';

interface ManualFulfillmentInput {
  code?: string;
  note?: string;
}

export function isManualFulfillmentMode(mode: FulfillmentMode) {
  return mode === 'MANUAL_CODE' || mode === 'MANUAL_TOPUP';
}

export function assertManualFulfillmentInput(mode: FulfillmentMode, input: ManualFulfillmentInput) {
  if (!isManualFulfillmentMode(mode)) throw new Error('ORDER_NOT_MANUAL');

  const code = input.code?.trim() || undefined;
  const note = input.note?.trim() || undefined;
  if (mode === 'MANUAL_CODE' && !code) throw new Error('FULFILLMENT_CODE_REQUIRED');

  return { code, note };
}
