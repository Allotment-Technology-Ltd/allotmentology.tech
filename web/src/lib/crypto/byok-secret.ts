import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const SCRYPT_SALT = "allotment-byok-v1";

function derivedKey(): Buffer {
  const secret = process.env.BYOK_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "BYOK_ENCRYPTION_KEY must be set to at least 32 characters to store API keys.",
    );
  }
  return scryptSync(secret, SCRYPT_SALT, KEY_LEN);
}

export function isByokEncryptionConfigured(): boolean {
  const s = process.env.BYOK_ENCRYPTION_KEY?.trim();
  return Boolean(s && s.length >= 32);
}

export function encryptByokSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const key = derivedKey();
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptByokSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = derivedKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
