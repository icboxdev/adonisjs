import User from '#models/user'
import { RoleService, UserRole } from '#services/auth/role_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthRoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, role: UserRole) {
    const user = ctx.auth.user as User

    if (!user || user.isActive === false || user.role === null) {
      return ctx.response.unauthorized({ message: 'No user authenticated' })
    }

    try {
      RoleService.checkRole(user, role)
    } catch (error) {
      return ctx.response.forbidden({ message: 'Acesso negado' })
    }

    return await next()
  }
}
