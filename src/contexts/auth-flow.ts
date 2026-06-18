export function resolveOtpPhone(pendingPhone: string, phoneOverride?: string) {
  return phoneOverride || pendingPhone || null;
}
