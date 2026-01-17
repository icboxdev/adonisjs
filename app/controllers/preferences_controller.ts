import { PreferenceService } from '#services/preference_service'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class PreferencesController {
    async index({ response }: HttpContext) {
        try {
            return PreferenceService.index()
        } catch (error) {
            logger.error(error.message)
            return response.internalServerError({ message: 'Erro interno no servidor' })
        }
    }
    async show({ response, params }: HttpContext) {
        try {
            return PreferenceService.show({ name: params.name })
        } catch (error) {
            logger.error(error.message)
            return response.internalServerError({ message: 'Erro interno no servidor' })
        }
    }
    async store({ response, request }: HttpContext) {
        try {
            const payload = request.only(['name', 'value'])
            return PreferenceService.store(payload)
        } catch (error) {
            logger.error(error.message)
            return response.internalServerError({ message: 'Erro interno no servidor' })
        }
    }
    async update({ response, request, params }: HttpContext) {
        try {
            const payload = request.only(['value'])
            return PreferenceService.update({ name: params.name, value: payload.value })
        } catch (error) {
            logger.error(error.message)
            return response.internalServerError({ message: 'Erro interno no servidor' })
        }
    }
    async delete({ response, params }: HttpContext) {
        try {
            return PreferenceService.delete({ name: params.name })
        } catch (error) {
            logger.error(error.message)
            return response.internalServerError({ message: 'Erro interno no servidor' })
        }
    }

}