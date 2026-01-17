import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { errors as vineErrors } from '@vinejs/vine'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * Exibe stacktrace apenas fora de produção
   */
  protected debug = !app.inProduction

  /**
   * Tratamento centralizado de exceções
   */
  async handle(error: any, ctx: HttpContext) {
    /**
     * Erros de validação (VineJS)
     */
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.unprocessableEntity({
        success: false,
        message: 'Erro de validação',
        errors: error.messages,
      })
    }

    /**
     * Exceções HTTP conhecidas (Exception, Unauthorized, Forbidden, etc)
     */
    if (error?.status) {
      return ctx.response.status(error.status).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    /**
     * Erro inesperado
     * Não vazar detalhes em produção
     */
    logger.error(error)

    return ctx.response.internalServerError({
      success: false,
      message: app.inProduction
        ? 'Erro interno do servidor'
        : (error as Error)?.message,
    })
  }

  /**
   * Reporte de erros (logs / monitoramento)
   */
  async report(error: any) {
    /**
     * Em produção, logar apenas erros não tratados ou 5xx
     */
    if (!error?.status || error.status >= 500) {
      logger.error(error)
    }
  }
}
