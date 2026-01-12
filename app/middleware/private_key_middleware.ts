import { AppKeyService } from '#services/app_key_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PrivateKeyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const apiKey = ctx.request.header('apiKey')
    const ip = ctx.request.ip()

    /* ---------------------------------------------------------------------- */
    /* 1. Chave não informada                                                  */
    /* ---------------------------------------------------------------------- */

    if (!apiKey) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'private_key_missing',
        success: false,
        reason: 'Chave privada não informada',
      })

      return ctx.response.unauthorized({
        code: 'private_key_missing',
        message: 'Chave privada não informada',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 2. Rate limit por IP + chave                                            */
    /* ---------------------------------------------------------------------- */

    const isRateLimited = await AppKeyService.checkRateLimit(ip, apiKey)

    if (isRateLimited) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'private_key_rate_limited',
        success: false,
        reason: 'Muitas tentativas consecutivas',
      })

      return ctx.response.tooManyRequests({
        code: 'private_key_rate_limited',
        message: 'Too many attempts. Please try again later.',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 3. Validação da chave privada                                           */
    /* ---------------------------------------------------------------------- */

    const privateKey = AppKeyService.getPrivateKey()

    if (!privateKey) {
      return ctx.response.internalServerError({
        code: 'private_key_not_configured',
        message: 'Chave privada não configurada no servidor',
      })
    }

    const isValid = await AppKeyService.safeCompare(privateKey, apiKey)

    if (!isValid) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'private_key_invalid',
        success: false,
        reason: 'Chave privada inválida',
      })

      await AppKeyService.handleFailedAttempt(apiKey, ip)

      return ctx.response.unauthorized({
        code: 'private_key_invalid',
        message: 'Chave privada inválida',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 4. Sucesso                                                             */
    /* ---------------------------------------------------------------------- */

    await AppKeyService.handleSuccessfulAttempt(apiKey)

    // flag explícita de acesso total
    ctx.isFullAccess = true

    await AppKeyService.loggerAttempt({
      ip,
      event: 'private_key_valid',
      success: true,
      reason: 'Chave privada válida',
    })

    return next()
  }
}
