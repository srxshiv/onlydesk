import { Global, Module } from '@nestjs/common'
import { CryptoService } from './crypto/crypto.service'
import { AbilityFactory } from './casl/ability.factory'

/**
 * Cross-cutting providers shared by every feature module: the CASL ability
 * factory (authorization) and the crypto service (at-rest secret encryption).
 * Global so feature modules can inject them without re-importing.
 */
@Global()
@Module({
  providers: [CryptoService, AbilityFactory],
  exports: [CryptoService, AbilityFactory],
})
export class CommonModule {}
