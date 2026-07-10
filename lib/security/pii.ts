import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Application-layer AES-256-GCM for sensitive person fields (ID numbers,
// residential addresses) — chosen over pgcrypto/Vault because it needs no
// new Postgres extension, no Vault secret, no RPC indirection: ciphertext
// is stored as ordinary text and supabase-js .select()/.insert() work
// exactly as they do today. See STIVARA_V2 Phase 1 Milestone 4 plan.
//
// Stored format: base64(iv[12] || authTag[16] || ciphertext). IV is random
// per encryption (never reused with the same key, which GCM requires).

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.PII_ENCRYPTION_KEY
  if (!key) throw new Error('PII_ENCRYPTION_KEY is not configured')
  const buf = Buffer.from(key, 'base64')
  if (buf.length !== 32) throw new Error('PII_ENCRYPTION_KEY must be 32 bytes (base64-encoded) — generate with `openssl rand -base64 32`')
  return buf
}

export function encryptPII(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}

export function decryptPII(stored: string): string {
  const key = getKey()
  const raw = Buffer.from(stored, 'base64')
  const iv = raw.subarray(0, IV_LENGTH)
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

export function isPIIEncryptionConfigured(): boolean {
  return !!process.env.PII_ENCRYPTION_KEY
}
