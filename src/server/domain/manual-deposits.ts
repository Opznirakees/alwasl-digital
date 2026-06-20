export function normalizeManualDepositTransactionId(transactionId: string) {
  return transactionId.trim().toUpperCase();
}

export function manualDepositLedgerReference(transactionId: string) {
  return `MANUAL-DEPOSIT:${normalizeManualDepositTransactionId(transactionId)}`;
}
