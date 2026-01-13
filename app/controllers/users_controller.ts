import User from '#models/user'
import { userCreateValidator, userUpdateValidator } from '#validators/app_validators'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { errors } from '@vinejs/vine'

export default class UsersController {
  async index({ response }: HttpContext) {
    try {
      const users = await User.query().paginate(1, 10)
      return response.ok(users.map((user) => user.serialize()))
    } catch (error) {
      logger.error(error.message)
      return response.internalServerError({ message: 'Falha ao buscar usuários' })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(userCreateValidator)
      const user = await User.create(payload)
      return response.created(user.serialize())
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return response.unprocessableEntity({
          message: 'Validation failure',
          errors: error.messages,
        })
      }
      logger.error(error.message)
      return response.internalServerError({ message: 'Falha ao criar usuário' })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id!)
      return response.ok(user.serialize())
    } catch (error) {
      logger.error(error.message)
      return response.internalServerError({ message: 'Falha ao buscar usuário' })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id!)
      const payload = await request.validateUsing(userUpdateValidator)
      user.merge(payload)
      await user.save()
      return response.ok(user.serialize())
    } catch (error) {
      logger.error(error.message)
      return response.internalServerError({ message: 'Falha ao atualizar usuário' })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id!)
      await user.delete()
      return response.noContent()
    } catch (error) {
      logger.error(error.message)
      return response.internalServerError({ message: 'Falha ao deletar usuário' })
    }
  }
}
