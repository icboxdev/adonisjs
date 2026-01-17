import type { HttpContext } from '@adonisjs/core/http'

import User from '#models/users/user'
import { AuthService } from '#services/auth/auth_services'
import { UserService } from '#services/user/user_service'


import BusinessException from '#exceptions/business_exception'
import { AuthCreateSetupValidator, AuthLoginValidator, AuthPasswordResetValidator, AuthPasswordUpdateValidator, AuthRequestEmailValidator, AuthUpdateValidator } from '#validators/auth/auth_validators'
import CacheService from '#start/cache'

export default class AuthController {
  /* -------------------------------------------------------------------------- */
  /* SETUP                                                                      */
  /* -------------------------------------------------------------------------- */

  async checkStartSetup({ response }: HttpContext) {
    const started = await UserService.checkStartSetup()
    return response.ok({ started })
  }

  async createSuperUser({ request, response }: HttpContext) {
    const payload = await request.validateUsing(AuthCreateSetupValidator)
    await UserService.createSuperAdmin(payload)

    return response.created({
      message: 'Super administrador criado com sucesso',
    })
  }

  /* -------------------------------------------------------------------------- */
  /* AUTH                                                                       */
  /* -------------------------------------------------------------------------- */

  async login({ request, response }: HttpContext) {
    const { username, password } = await request.validateUsing(AuthLoginValidator)
    const ip = request.ip()

    const { token, user } = await AuthService.login({
      username,
      password,
      ip,
    })

    return response.ok({
      isAuthenticated: true,
      token,
      tokenType: 'Bearer',
      user,
    })
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const token = user.currentAccessToken

    if (!token) {
      throw BusinessException.badRequest('Nenhum token ativo encontrado')
    }

    await User.accessTokens.delete(user, token.identifier)
    await CacheService.deleteSingle('users', user.id)

    return response.ok({
      message: 'Logout realizado com sucesso',
    })
  }

  async revokeAll({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await AuthService.logout(user)

    return response.ok({
      message: 'Todos os tokens foram revogados com sucesso',
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const authUser = await AuthService.getMe(user)

    return response.ok({
      isAuthenticated: true,
      user: authUser,
    })
  }

  /* -------------------------------------------------------------------------- */
  /* USER                                                                       */
  /* -------------------------------------------------------------------------- */

  async updateMe({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(AuthUpdateValidator)

    if (payload.email && payload.email !== user.email) {
      const isBlacklisted = await AuthService.isBlacklisted({
        email: payload.email,
      })

      if (isBlacklisted) {
        throw BusinessException.forbidden('Este email não pode ser utilizado')
      }
    }

    const updatedUser = await AuthService.updateUser(user, payload)

    return response.ok({
      message: 'Dados atualizados com sucesso',
      user: updatedUser,
    })
  }

  /* -------------------------------------------------------------------------- */
  /* EMAIL                                                                      */
  /* -------------------------------------------------------------------------- */

  async requestEmailVerification({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const ip = request.ip()

    if (user.emailVerifiedAt) {
      throw BusinessException.badRequest('E-mail já verificado')
    }

    await AuthService.requestEmailVerification(user, ip)

    return response.ok({
      message: 'E-mail de verificação enviado com sucesso',
    })
  }

  async verifyEmail({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { token } = request.only(['token'])
    const ip = request.ip()

    if (user.emailVerifiedAt) {
      throw BusinessException.badRequest('E-mail já verificado')
    }

    if (!token) {
      throw BusinessException.badRequest('Token de verificação é obrigatório')
    }

    await AuthService.verifyEmail(user.email, token, ip)

    return response.ok({
      message: 'E-mail verificado com sucesso',
    })
  }

  /* -------------------------------------------------------------------------- */
  /* PASSWORD                                                                   */
  /* -------------------------------------------------------------------------- */

  async requestPasswordReset({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(AuthRequestEmailValidator)
    const ip = request.ip()

    await AuthService.requestPasswordReset(email, ip)

    return response.ok({
      message: 'Se o e-mail existir, você receberá as instruções em breve',
    })
  }

  async changePassword({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { password, currentPassword } =
      await request.validateUsing(AuthPasswordUpdateValidator)

    await AuthService.updatePassword(user, password, currentPassword)

    return response.ok({
      message: 'Senha alterada com sucesso',
    })
  }

  async resetPassword({ request, response }: HttpContext) {
    const { email, token, password } =
      await request.validateUsing(AuthPasswordResetValidator)

    const ip = request.ip()

    await AuthService.resetPassword({
      email,
      token,
      password,
      ip,
    })

    return response.ok({
      message: 'Senha redefinida com sucesso',
    })
  }
}
