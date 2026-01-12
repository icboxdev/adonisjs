import User from '#models/user'
import { AuthService, UserRole } from '#services/auth_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthRoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, role: UserRole) {
    const user = ctx.auth.user as User

    if (!user || user.active === false || user.role === null) {
      return ctx.response.unauthorized({ message: 'No user authenticated' })
    }

    const success = AuthService.checkRole({ user, required: role })
    
    if (!success) {
      return ctx.response.forbidden({ message: 'Acesso negado' })
    }
    
    return await next()
  }
}
