export const MAX_OTP_ATTEMPTS = 5;

export function isOtpAttemptLocked(attempts: number, maxAttempts = MAX_OTP_ATTEMPTS) {
  return attempts >= maxAttempts;
}

export function nextOtpAttemptCount(attempts: number) {
  return attempts + 1;
}
