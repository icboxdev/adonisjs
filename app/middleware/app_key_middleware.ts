import { AppKeyService } from '#services/app_key_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AppKeyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const apiKey = ctx.request.header('apiKey')
    const ip = ctx.request.ip()

    /* ---------------------------------------------------------------------- */
    /* 1. API Key não informada                                                 */
    /* ---------------------------------------------------------------------- */

    if (!apiKey) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'api_key_missing',
        success: false,
        reason: 'API Key não informada',
      })

      return ctx.response.unauthorized({
        code: 'api_key_missing',
        message: 'API Key não informada',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 2. Rate limit por IP + chave                                            */
    /* ---------------------------------------------------------------------- */

    const isRateLimited = await AppKeyService.checkRateLimit(ip, apiKey)

    if (isRateLimited) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'api_key_rate_limited',
        success: false,
        reason: 'Muitas tentativas consecutivas',
      })

      return ctx.response.tooManyRequests({
        code: 'api_key_rate_limited',
        message: 'Too many attempts. Please try again later.',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 3. Chave privada (env)                                                  */
    /* ---------------------------------------------------------------------- */

    const privateKey = AppKeyService.getPrivateKey()

    if (privateKey && (await AppKeyService.safeCompare(privateKey, apiKey))) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'api_key_valid_private',
        success: true,
        reason: 'API Key privada válida',
      })
      ctx.isFullAccess = true
      return next()
    }

    /* ---------------------------------------------------------------------- */
    /* 4. Lista de chaves ativas                                               */
    /* ---------------------------------------------------------------------- */

    const activeKeys = await AppKeyService.listActive()

    if (activeKeys.length === 0) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'api_key_not_found',
        success: false,
        reason: 'Nenhuma API Key ativa',
      })

      return ctx.response.unauthorized({
        code: 'api_key_not_found',
        message: 'Nenhuma API Key ativa',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 5. Validação da chave                                                   */
    /* ---------------------------------------------------------------------- */

    const validKey = await AppKeyService.findValidKey(activeKeys, apiKey)

    if (!validKey) {
      await AppKeyService.loggerAttempt({
        ip,
        event: 'api_key_invalid',
        success: false,
        reason: 'API Key inválida',
      })

      await AppKeyService.handleFailedAttempt(apiKey, ip)

      return ctx.response.unauthorized({
        code: 'api_key_invalid',
        message: 'API Key inválida',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 6. Chave bloqueada                                                      */
    /* ---------------------------------------------------------------------- */

    const isBlocked = await AppKeyService.isKeyBlocked(validKey.id!)

    if (isBlocked) {
      await AppKeyService.loggerAttempt({
        ip,
        keyId: validKey.id,
        event: 'api_key_blocked',
        success: false,
        reason: 'API Key bloqueada',
      })

      return ctx.response.forbidden({
        code: 'api_key_blocked',
        message: 'API Key bloqueada',
      })
    }

    /* ---------------------------------------------------------------------- */
    /* 7. Sucesso                                                              */
    /* ---------------------------------------------------------------------- */

    await AppKeyService.handleSuccessfulAttempt(apiKey)

    ctx.appKey = validKey

    return next()
  }
}
