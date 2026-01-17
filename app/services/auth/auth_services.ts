import User from '#models/users/user'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

import BusinessException from '#exceptions/business_exception'

import { PasswordService } from '#services/auth/password_service'
import { EmailVerificationService } from '#services/auth/email_verification_service'
import { UserService } from '#services/user/user_service'
import { UserAnonymizationService } from '#services/user/user_anonymization_service'
import { BlacklistService } from '#services/security/blacklist_service'
import { TokenService } from '#services/auth/token_service'
import { RoleService, UserRole } from '#services/auth/role_service'
import { LoginProtectionService } from '#services/security/login_protection_service'

import CacheService from '#start/cache'

interface LoginParams {
  username: string
  password: string
  ip?: string
}

interface LoginResult {
  token: any
  user: any
}

export class AuthService {
  /* -------------------------------------------------------------------------- */
  /* AUTHENTICATION                                                             */
  /* -------------------------------------------------------------------------- */
  static async login(params: LoginParams): Promise<LoginResult> {
    const { username, password, ip = 'unknown' } = params

    if (!username || !password) {
      throw BusinessException.unauthorized(
        'Credenciais inválidas',
        'INVALID_CREDENTIALS'
      )
    }

    const identifier = username.trim().toLowerCase()

    const loginCheck = await LoginProtectionService.checkLoginAttempt({
      identifier,
      ip,
    })

    if (!loginCheck.allowed) {
      if (loginCheck.isBlocked) {
        throw BusinessException.forbidden(
          'Conta temporariamente bloqueada devido a múltiplas tentativas de login',
          'LOGIN_TEMP_BLOCKED'
        )
      }

      throw BusinessException.tooManyRequests(
        `Muitas tentativas de login. Tentativas restantes: ${loginCheck.attemptsRemaining}`,
        'LOGIN_RATE_LIMIT'
      )
    }

    const user = await User.query()
      .where('email', identifier)
      .first()

    if (!user || !UserService.isActive(user)) {
      await LoginProtectionService.recordLoginAttempt({
        identifier,
        ip,
        success: false,
      })

      throw BusinessException.unauthorized(
        'Credenciais inválidas',
        'INVALID_CREDENTIALS'
      )
    }

    const authUser = await User.verifyCredentials(identifier, password)

    if (!authUser) {
      await LoginProtectionService.recordLoginAttempt({
        identifier,
        ip,
        success: false,
        userName: user.name,
        userEmail: user.email,
      })

      throw BusinessException.unauthorized(
        'Credenciais inválidas',
        'INVALID_CREDENTIALS'
      )
    }

    await LoginProtectionService.recordLoginAttempt({
      identifier,
      ip,
      success: true,
    })

    const token = await TokenService.createAccessToken(authUser)
    await this.updateLoginMetadata(authUser, ip)
    await this.cacheUser(authUser)

    return {
      token,
      user: authUser.serialize(),
    }
  }

  static async logout(user: User): Promise<boolean> {
    return TokenService.revokeAllTokens(user)
  }

  static async getMe(user: User): Promise<User> {
    return UserService.getMe(user)
  }

  /* -------------------------------------------------------------------------- */
  /* ROLE MANAGEMENT                                                            */
  /* -------------------------------------------------------------------------- */
  static checkRole(user: User, required: UserRole): void {
    RoleService.checkRole(user, required)
  }

  static checkSuper(user: User): void {
    RoleService.checkSuper(user)
  }

  static checkAdmin(user: User): void {
    RoleService.checkAdmin(user)
  }

  static checkUser(user: User): void {
    RoleService.checkUser(user)
  }

  static checkView(user: User): void {
    RoleService.checkView(user)
  }

  /* -------------------------------------------------------------------------- */
  /* USER MANAGEMENT (DELEGAÇÃO)                                                */
  /* -------------------------------------------------------------------------- */
  static createUser(payload: any) {
    return UserService.create(payload)
  }

  static updateUser(user: User, payload: any) {
    return UserService.update(user, payload)
  }

  static deleteUser(user: User): Promise<boolean> {
    return UserService.delete(user)
  }


  static anonymizeUser(user: User): Promise<boolean> {
    return UserAnonymizationService.anonymize(user)
  }

  /* -------------------------------------------------------------------------- */
  /* PASSWORD MANAGEMENT                                                        */
  /* -------------------------------------------------------------------------- */
  static async requestPasswordReset(email: string, ip?: string): Promise<boolean> {
    return PasswordService.requestPasswordReset({ email, ip })
  }

  static async updatePassword(
    user: User,
    password: string,
    currentPassword: string
  ): Promise<boolean> {
    const isPasswordValid = await hash.verify(user.password, currentPassword)

    if (!isPasswordValid) {
      throw BusinessException.badRequest(
        'Senha atual inválida',
        'INVALID_CURRENT_PASSWORD'
      )
    }

    user.password = password
    await user.save()

    await CacheService.deleteSingle('users', user.id)
    return true
  }

  static async resetPassword(params: {
    email: string
    token: string
    password: string
    ip?: string
  }): Promise<boolean> {
    return PasswordService.resetPassword(params)
  }

  /* -------------------------------------------------------------------------- */
  /* EMAIL VERIFICATION                                                         */
  /* -------------------------------------------------------------------------- */
  static async requestEmailVerification(user: User, ip?: string): Promise<boolean> {
    return EmailVerificationService.requestEmailVerification({ user, ip })
  }

  static async verifyEmail(email: string, token: string, ip?: string): Promise<boolean> {
    return EmailVerificationService.verifyEmail({ email, token, ip })
  }

  /* -------------------------------------------------------------------------- */
  /* BLACKLIST                                                                  */
  /* -------------------------------------------------------------------------- */
  static async isBlacklisted(input: { email: string }): Promise<boolean> {
    return BlacklistService.isBlacklisted(input)
  }

  static async addToBlacklist(user: User): Promise<void> {
    await BlacklistService.addToBlacklist(user)
  }

  /* -------------------------------------------------------------------------- */
  /* PRIVATE HELPERS                                                            */
  /* -------------------------------------------------------------------------- */
  private static async updateLoginMetadata(user: User, ip?: string): Promise<void> {
    user.merge({
      lastLoginAt: DateTime.now(),
      lastIp: ip ?? null,
    })
    await user.save()
  }

  private static async cacheUser(user: User): Promise<void> {
    await CacheService.set({
      key: `users:${user.id}`,
      value: user.serialize(),
      ttl: '1h',
    })
  }
}

export { UserRole } from './role_service.js'
export type { UserEntity, UserEntityUpdate } from '../user/user_service.js'
