import { Injectable } from '@nestjs/common'
import { decryptJson, decryptString, encryptJson, encryptString } from './encryption'

/**
 * Injectable wrapper over the AES-256-GCM helpers. Use this anywhere a service
 * needs to encrypt/decrypt secrets explicitly (e.g. OAuth token storage).
 * The `installed_tools.config` column encrypts itself via the TypeORM
 * transformer, so most callers never touch this directly.
 */
@Injectable()
export class CryptoService {
  encryptString = encryptString
  decryptString = decryptString
  encryptJson = encryptJson
  decryptJson = decryptJson
}
