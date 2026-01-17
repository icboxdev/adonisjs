import User from '#models/users/user'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { TokenService } from '#services/auth/token_service'
import { BlacklistService } from '#services/security/blacklist_service'
import { UserRole } from '#services/auth/role_service'
import CacheService from '#start/cache'

export class UserAnonymizationService {
  static async anonymize(user: User): Promise<boolean> {
    const randomPassword = await this.generateRandomPassword()

    user.merge({
      email: `deleted_${user.id}@internal.system`,
      name: 'User Deleted',
      password: randomPassword,
      role: UserRole.DELETED,
      settings: null,
      lastLoginAt: null,
      lastIp: null,
      emailVerifiedAt: null,
      deletedAt: DateTime.now(),
      isActive: false,
      isDeleted: true,
    })

    await user.save()
    await TokenService.revokeAllTokens(user)
    await BlacklistService.addToBlacklist(user)
    await CacheService.deleteSingle('users', user.id)
    return true
  }

  private static async generateRandomPassword(): Promise<string> {
    const randomString = Math.random().toString(36) + Date.now().toString(36)
    return await hash.make(randomString)
  }
}
