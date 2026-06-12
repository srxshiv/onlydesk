import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import type { ValueTransformer } from 'typeorm'
import { env } from '../../env'

/**
 * AES-256-GCM at-rest encryption for sensitive JSON payloads (per-tool secrets,
 * OAuth tokens). Keys are loaded strictly from the environment — never written
 * to disk or the database. The stored envelope is a versioned, self-describing
 * string so the IV and auth tag travel with the ciphertext:
 *
 *   v1.<iv base64>.<authTag base64>.<ciphertext base64>
 *
 * A fresh random 96-bit IV is generated per encryption (GCM requirement), so
 * encrypting the same plaintext twice yields different envelopes.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const VERSION = 'v1'

/** Decode the configured key (base64 or hex) into a 32-byte Buffer. */
function loadKey(): Buffer {
  const raw = env.CONFIG_ENCRYPTION_KEY
  const key = /^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0 ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('CONFIG_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM')
  return key
}

// Resolve the key once at module load; env validation already guarantees shape.
const KEY = loadKey()

export function encryptString(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.')
}

export function decryptString(envelope: string): string {
  const parts = envelope.split('.')
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Malformed encryption envelope')
  const [, ivB64, tagB64, ctB64] = parts
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()])
  return plaintext.toString('utf8')
}

/** Encrypt an arbitrary JSON-serializable value into an envelope string. */
export function encryptJson(value: unknown): string {
  return encryptString(JSON.stringify(value ?? {}))
}

/** Decrypt an envelope string back into a JSON value, tolerating empty input. */
export function decryptJson<T = Record<string, unknown>>(envelope: string | null | undefined): T {
  if (!envelope) return {} as T
  return JSON.parse(decryptString(envelope)) as T
}

/**
 * TypeORM transformer that transparently encrypts an object column on write and
 * decrypts on read. The underlying database column is `text` holding the
 * envelope; the application always sees a plain object.
 */
export const encryptedJsonTransformer: ValueTransformer = {
  to: (value: unknown): string => encryptJson(value),
  from: (value: string | null): Record<string, unknown> => decryptJson(value),
}
