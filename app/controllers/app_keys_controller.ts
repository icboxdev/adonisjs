import AppKey from '#models/app_key'
import { AppKeyService } from '#services/app_key_service'
import { appKeyStoreValidator, appKeyUpdateValidator } from '#validators/app_validators'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class AppKeysController {
  async get_loggers({ response }: HttpContext) {
    try {
      const loggers = await AppKeyService.get_loggers()
      return response.ok(loggers)
    } catch (error) {
      logger.error(error)
      return response.forbidden({ message: 'Acesso negado' })
    }
  }

  async index({ response }: HttpContext) {
    try {
      const appKeys = await AppKeyService.db_list()
      return response.ok(appKeys)
    } catch (error) {
      logger.error(error)
      return response.forbidden({ message: 'Acesso negado' })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(appKeyStoreValidator)
      const appKey = await AppKeyService.db_create(payload)
      return response.created(appKey)
    } catch (error) {
      logger.error(error)
      return response.internalServerError({ message: 'Falha ao criar a chave' })
    }
  }

  async show({ response, params }: HttpContext) {
    try {
      const appKey = await AppKey.findOrFail(params.id)
      return response.ok(appKey)
    } catch (error) {
      logger.error(error)
      return response.internalServerError({ message: 'Falha ao buscar a chave' })
    }
  }

  async update({ request, response, params }: HttpContext) {
    try {
      const payload = await request.validateUsing(appKeyUpdateValidator)
      const appKey = await AppKeyService.db_update({
        id: params.id,
        payload,
      })

      return response.ok(appKey)
    } catch (error) {
      logger.error(error)
      return response.internalServerError({ message: 'Falha ao atualizar a chave' })
    }
  }

  async destroy({ response, params }: HttpContext) {
    try {
      await AppKeyService.db_delete({ id: params.id })
      return response.noContent()
    } catch (error) {
      logger.error(error)
      return response.internalServerError({ message: 'Falha ao deletar a chave' })
    }
  }
}
