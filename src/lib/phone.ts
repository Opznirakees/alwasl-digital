import { findPhoneDialCodeInNumber } from '@/data/phone-countries';

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function stripInternationalPrefix(value: string) {
  const digits = digitsOnly(value);
  return digits.startsWith('00') ? digits.slice(2) : digits;
}

function removeTrunkZeroAfterDialCode(normalizedPhone: string) {
  const dialCode = findPhoneDialCodeInNumber(normalizedPhone);
  if (!dialCode) return normalizedPhone;

  const subscriber = normalizedPhone.slice(dialCode.length);
  if (subscriber.startsWith('0') && subscriber.length > 4) {
    return `${dialCode}${subscriber.slice(1)}`;
  }

  return normalizedPhone;
}

export function normalizePhoneForDialCode(phoneCode: string, phoneInput: string) {
  const dialCode = stripInternationalPrefix(phoneCode);
  let subscriber = stripInternationalPrefix(phoneInput);

  if (!dialCode) return subscriber ? `+${subscriber}` : '';
  if (!subscriber) return `+${dialCode}`;

  if (subscriber.startsWith(dialCode)) {
    return `+${removeTrunkZeroAfterDialCode(subscriber)}`;
  }

  if (subscriber.startsWith('0')) {
    subscriber = subscriber.slice(1);
  }

  return `+${dialCode}${subscriber}`;
}

export function normalizeInternationalPhoneForWhatsApp(phone: string) {
  let normalized = stripInternationalPrefix(phone);
  normalized = removeTrunkZeroAfterDialCode(normalized);

  if (normalized.startsWith('0')) {
    if (normalized.startsWith('07') && normalized.length >= 10) {
      return `964${normalized.slice(1)}`;
    }

    return `31${normalized.slice(1)}`;
  }

  return normalized;
}
