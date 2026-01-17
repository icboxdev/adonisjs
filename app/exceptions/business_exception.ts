import { Exception } from '@adonisjs/core/exceptions'

export type BusinessExceptionOptions = {
  status?: number
  code?: string
  details?: unknown
}

export default class BusinessException extends Exception {
  public details?: unknown

  constructor(message: string, options: BusinessExceptionOptions = {}) {
    super(message, {
      status: options.status ?? 400,
      code: options.code ?? 'BUSINESS_ERROR',
    })

    this.details = options.details
  }

  /* -------------------------------------------------------------------------- */
  /* HTTP SEMANTIC HELPERS                                                      */
  /* -------------------------------------------------------------------------- */

  static badRequest(
    message = 'Requisição inválida',
    code = 'BAD_REQUEST',
    details?: unknown
  ) {
    return new BusinessException(message, {
      status: 400,
      code,
      details,
    })
  }

  static unauthorized(
    message = 'Não autenticado',
    code = 'UNAUTHORIZED'
  ) {
    return new BusinessException(message, {
      status: 401,
      code,
    })
  }

  static forbidden(
    message = 'Acesso negado',
    code = 'FORBIDDEN'
  ) {
    return new BusinessException(message, {
      status: 403,
      code,
    })
  }

  static notFound(
    message = 'Recurso não encontrado',
    code = 'NOT_FOUND'
  ) {
    return new BusinessException(message, {
      status: 404,
      code,
    })
  }

  static conflict(
    message = 'Conflito de dados',
    code = 'CONFLICT'
  ) {
    return new BusinessException(message, {
      status: 409,
      code,
    })
  }

  static validation(
    message = 'Erro de validação',
    details?: unknown,
    code = 'VALIDATION_ERROR'
  ) {
    return new BusinessException(message, {
      status: 422,
      code,
      details,
    })
  }

  static tooManyRequests(
    message = 'Muitas requisições',
    code = 'TOO_MANY_REQUESTS'
  ) {
    return new BusinessException(message, {
      status: 429,
      code,
    })
  }

  static internal(
    message = 'Erro interno',
    code = 'INTERNAL_ERROR'
  ) {
    return new BusinessException(message, {
      status: 500,
      code,
    })
  }
}
