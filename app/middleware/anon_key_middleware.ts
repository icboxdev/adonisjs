import { AppKeyService } from '#services/app_key_service'
import { EncryptionService } from '#services/encryption_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AnonKeyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const publicKey = ctx.request.header('publicKey')

    if (!publicKey) {
      return ctx.response.unauthorized({
        code: 'public_key_missing',
        message: 'Chave pública não informada',
      })
    }

    const localPublicKey = AppKeyService.getPublicKey()

    if (localPublicKey !== EncryptionService.decryptBase64(publicKey)) {
      return ctx.response.unauthorized({
        code: 'public_key_invalid',
        message: 'Chave pública inválida',
      })
    }

    return next()
  }
}
