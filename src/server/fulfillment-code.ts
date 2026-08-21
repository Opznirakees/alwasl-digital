import { createCipheriv, createHash, randomBytes } from 'node:crypto';

interface FulfillmentEncryptionEnv {
  [key: string]: string | undefined;
  FULFILLMENT_ENCRYPTION_KEY?: string;
  OTP_PEPPER?: string;
}

function resolveKeyMaterial(env: FulfillmentEncryptionEnv = process.env) {
  const value = env.FULFILLMENT_ENCRYPTION_KEY?.trim() || env.OTP_PEPPER?.trim();
  if (!value) throw new Error('FULFILLMENT_ENCRYPTION_NOT_CONFIGURED');
  return createHash('sha256').update(`alwasl:fulfillment:v1:${value}`).digest();
}

export function encryptFulfillmentCode(code: string, env: FulfillmentEncryptionEnv = process.env) {
  const normalized = code.trim();
  if (!normalized) throw new Error('FULFILLMENT_CODE_REQUIRED');

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', resolveKeyMaterial(env), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}
