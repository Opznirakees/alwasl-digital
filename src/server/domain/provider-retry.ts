export const PROVIDER_RETRY_DELAY_MS = 3 * 60 * 1000;
export const PROVIDER_RETRY_MAX_ATTEMPTS = 3;

export function nextProviderRetryAt(now = new Date()) {
  return new Date(now.getTime() + PROVIDER_RETRY_DELAY_MS);
}

export function hasProviderRetryAttemptsRemaining(attemptCount: number, maxAttempts = PROVIDER_RETRY_MAX_ATTEMPTS) {
  return attemptCount < maxAttempts;
}
