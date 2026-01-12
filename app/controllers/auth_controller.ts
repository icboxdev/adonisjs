import User from '#models/user'
import { AuthService } from '#services/auth_service'
import cache from '#start/cache'
import {
  authUpdateValidator,
  RequestEmailValidator,
  passwordResetValidator,
} from '#validators/app_validators'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const ip = request.ip()

    try {
      const { token, user } = await AuthService.obtenerToken({ email, password, ip })
      return response.ok({ message: 'Login successful', token, user })
    } catch (error) {
      if (error.status === 401) {
        return response.unauthorized({ message: error.message })
      }
      logger.error('Login error', { error: error.message, email, ip })
      return response.internalServerError({ message: 'Internal server error during login' })
    }
  }

  async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.unauthorized({ message: 'No user authenticated' })
      }
      const currentToken = user.currentAccessToken
      if (currentToken) {
        await User.accessTokens.delete(user, currentToken.identifier)
      }
      await cache.delete({ key: `user:${user.id}` })
      return response.ok({ message: 'Logout successful' })
    } catch (error) {
      logger.error('Logout error', { error: error.message, userId: auth.user?.id })
      return response.internalServerError({ message: 'Internal server error during logout' })
    }
  }

  async revoke({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.unauthorized({ message: 'No user authenticated' })
      }
      await AuthService.revokeAllTokens(user)
      return response.ok({ message: 'Revocation successful' })
    } catch (error) {
      logger.error('Revocation error', { error: error.message, userId: auth.user?.id })
      return response.internalServerError({ message: 'Internal server error during revocation' })
    }
  }

  async me({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.unauthorized({ message: 'No user authenticated' })
      }

      const authUser = await AuthService.get_me(user)
      return response.ok(authUser)
    } catch (error) {
      if (error.status === 403) {
        return response.forbidden({ message: error.message })
      }
      logger.error('Get me error', { error: error.message, userId: auth.user?.id })
      return response.internalServerError({ message: 'Internal server error fetching user data' })
    }
  }

  async updateMe({ auth, request, response }: HttpContext) {
    try {
      const user = await AuthService.get_me(auth.user as User)
      const payload = await request.validateUsing(authUpdateValidator)
      user?.merge(payload)
      await user?.save()
      await cache.delete({ key: `user:${user.id}` })
      return response.ok(user)
    } catch (error) {
      logger.error('Update me error', { error: error.message, userId: auth.user?.id })
      return response.internalServerError({ message: 'Internal server error updating user data' })
    }
  }

  async emailverifyRequest({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user as User
      const ip = request.ip()
      if (user.emailVerifiedAt) {
        return response.badRequest({ message: 'E-mail já verificado' })
      }
      const success = await AuthService.emailverifyRequest(user, ip)
      if (!success) {
        return response.tooManyRequests({
          message: 'Muitas tentativas. Tente novamente mais tarde.',
        })
      }
      return response.ok({ message: 'E-mail de verificação enviado com sucesso' })
    } catch (error) {
      logger.error('Password request reset error', { error: error.message })
      return response.internalServerError({
        message: 'Internal server error during password reset request',
      })
    }
  }

  async emailVerify({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user as User
      const { token } = request.only(['token'])
      const ip = request.ip()
      if (!user.emailVerifiedAt) {
        const success = await AuthService.emailVerify(user.email, token, ip)
        if (success) {
          return response.ok({ message: 'E-mail verificado com sucesso' })
        }
      }
    } catch (error) {
      logger.error('Password request reset error', { error: error.message })
      return response.internalServerError({
        message: 'Internal server error during password reset request',
      })
    }
  }

  async passwordResetRequest({ request, response }: HttpContext) {
    try {
      const { email } = await request.validateUsing(RequestEmailValidator)
      const ip = request.ip()
      const success = await AuthService.passwordResetRequest(email, ip)
      if (success) {
        return response.ok({ message: 'Password reset request sent successfully' })
      }
    } catch (error) {
      logger.error('Password request reset error', { error: error.message })
      return response.internalServerError({
        message: 'Internal server error during password reset request',
      })
    }
  }

  async passwordReset({ request, response }: HttpContext) {
    try {
      const { email, token, password } = await request.validateUsing(passwordResetValidator)
      const ip = request.ip()
      const success = await AuthService.passwordReset({ email, token, password, ip })
      if (success) {
        return response.ok({ message: 'Password reset successful' })
      }
    } catch (error) {
      logger.error('Password reset error', { error: error.message })
      return response.internalServerError({
        message: 'Internal server error during password reset',
      })
    }
  }
}
