import User from '#models/user'
import { Exception } from '@adonisjs/core/exceptions'

export enum UserRole {
  DELETED = 'deleted',
  VIEW = 'view',
  USER = 'user',
  ADMIN = 'admin',
  SUPER = 'super',
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.DELETED]: 0,
  [UserRole.VIEW]: 1,
  [UserRole.USER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER]: 4,
}

export class RoleService {
  static hasRole(user: User, requiredRole: UserRole): boolean {
    const userRole = user.role as UserRole
    const userLevel = ROLE_HIERARCHY[userRole]
    const requiredLevel = ROLE_HIERARCHY[requiredRole]

    return userLevel !== undefined && userLevel >= requiredLevel
  }

  static checkRole(user: User, requiredRole: UserRole): void {
    if (!this.hasRole(user, requiredRole)) {
      throw new Exception('Acesso negado', { status: 403 })
    }
  }

  static checkSuper(user: User): void {
    this.checkRole(user, UserRole.SUPER)
  }

  static checkAdmin(user: User): void {
    this.checkRole(user, UserRole.ADMIN)
  }

  static checkUser(user: User): void {
    this.checkRole(user, UserRole.USER)
  }

  static checkView(user: User): void {
    this.checkRole(user, UserRole.VIEW)
  }

  static getRoleLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role] ?? 0
  }
}
