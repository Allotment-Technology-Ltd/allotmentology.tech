import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const SCRYPT_SALT = "allotment-byok-v1";
/** Stored keys prefixed with this use AES-GCM + BYOK_ENCRYPTION_KEY. */
const BYOK_ENC_PREFIX = "enc:v1:";

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SCRYPT_SALT, KEY_LEN);
}

/**
 * When set to 8+ characters, keys are encrypted at the application layer before insert.
 * When unset or shorter, keys are stored as plaintext (rely on Neon access control + at-rest encryption).
 */
export function shouldEncryptApiKeysAtRest(): boolean {
  const s = process.env.BYOK_ENCRYPTION_KEY?.trim();
  return Boolean(s && s.length >= 8);
}

function encryptPayload(plaintext: string, secret: string): string {
  const iv = randomBytes(12);
  const key = deriveKey(secret);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptPayload(payloadB64: string, secret: string): string {
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = deriveKey(secret);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function packApiKeyForStorage(plaintext: string): string {
  const secret = process.env.BYOK_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 8) {
    return plaintext;
  }
  return `${BYOK_ENC_PREFIX}${encryptPayload(plaintext, secret)}`;
}

/**
 * Returns the raw API key, or null if encrypted but decryption failed (wrong server secret).
 */
export function readApiKeyFromStorage(stored: string): string | null {
  if (!stored.startsWith(BYOK_ENC_PREFIX)) {
    return stored;
  }
  const secret = process.env.BYOK_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 8) {
    return null;
  }
  try {
    return decryptPayload(stored.slice(BYOK_ENC_PREFIX.length), secret);
  } catch {
    return null;
  }
}
