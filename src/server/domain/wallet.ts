export function assertWalletCanDebit(balance: number, amount: number) {
  if (amount <= 0) {
    throw new Error('Wallet debit amount must be positive');
  }

  if (balance < amount) {
    throw new Error('INSUFFICIENT_WALLET_BALANCE');
  }
}

export function nextWalletBalance(balance: number, amount: number) {
  assertWalletCanDebit(balance, amount);
  return balance - amount;
}
