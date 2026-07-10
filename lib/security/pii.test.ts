import { describe, expect, it, beforeAll } from 'vitest'
import { encryptPII, decryptPII } from './pii'

describe('encryptPII / decryptPII', () => {
  beforeAll(() => {
    // A fixed 32-byte test key — never the real PII_ENCRYPTION_KEY.
    process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64')
  })

  it('round-trips plaintext through encryption and decryption', () => {
    const plaintext = 'S1234567D'
    const ciphertext = encryptPII(plaintext)
    expect(ciphertext).not.toBe(plaintext)
    expect(decryptPII(ciphertext)).toBe(plaintext)
  })

  it('produces different ciphertext for the same plaintext each time (random IV)', () => {
    const a = encryptPII('same input')
    const b = encryptPII('same input')
    expect(a).not.toBe(b)
    expect(decryptPII(a)).toBe('same input')
    expect(decryptPII(b)).toBe('same input')
  })

  it('throws on tampered ciphertext instead of silently returning wrong data', () => {
    const ciphertext = encryptPII('sensitive value')
    const tampered = ciphertext.slice(0, -4) + 'AAAA'
    expect(() => decryptPII(tampered)).toThrow()
  })
})
