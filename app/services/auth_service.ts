import User from '#models/user'
import cache from '#start/cache'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { AppEmailService } from './app_email_service.js'

export enum UserRole {
  VIEW = 'view',
  USER = 'user',
  ADMIN = 'admin',
  SUPER = 'super',
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.VIEW]: 1,
  [UserRole.USER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER]: 4,
}

export interface UserEntity {
  active: boolean
  name: string
  lastName: string | null
  email: string
  username: string | null
  password: string
  role: string
  settings: object | any | null
  lastLoginAt?: DateTime | null
  lastIp?: string | null
}

export interface UserEntityUpdate {
  active?: boolean
  name?: string
  lastName?: string | null
  email?: string
  username?: string | null
  password?: string
  role?: string
  settings?: object | any | null
}

interface ObtenerTokenParams {
  email: string
  password: string
  ip?: string
}

interface PasswordResetParams {
  email: string
  token: string
  password: string
  ip?: string
}

export class AuthService {
  private static readonly RESET_TTL = '15m'
  private static readonly VERIFY_TTL = '24h' // Tempo de vida do token de verificação
  private static readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 min
  private static readonly MAX_ATTEMPTS = 5
  private static readonly BLOCK_TIME = 30 * 60 * 1000 // 30 min

  /* -------------------------------------------------------------------------- */
  /* GET ME                                                                     */
  /* -------------------------------------------------------------------------- */
  static async get_me(user: User) {
    const cacheKey = `user:${user.id}`
    const cached = await cache.get<User>({ key: cacheKey })

    let auth: User

    if (cached) {
      auth = cached
    } else {
      auth = await User.findOrFail(user.id)
      await cache.set({
        key: cacheKey,
        value: auth.serialize(),
        ttl: '1h',
      })
    }

    if (!auth.active) {
      throw new Exception('Usuário inativo', { status: 403 })
    }

    return auth
  }

  /* -------------------------------------------------------------------------- */
  /* CHEKS / VALIDATIONS                                                        */
  /* -------------------------------------------------------------------------- */
  static async checkRole(params: { user: User; required: UserRole }): Promise<boolean> {
    const userRole = params.user.role as UserRole

    const userLevel = ROLE_HIERARCHY[userRole]
    const requiredLevel = ROLE_HIERARCHY[params.required]

    if (!userLevel || userLevel < requiredLevel) {
      throw new Exception('Acesso negado', { status: 403 })
    }

    return true
  }

  static async checkRoleSuper(params: { user: User }): Promise<boolean> {
    return this.checkRole({ user: params.user, required: UserRole.SUPER })
  }

  static async checkRoleAdmin(params: { user: User }): Promise<boolean> {
    return this.checkRole({ user: params.user, required: UserRole.ADMIN })
  }

  static async checkRoleUser(params: { user: User }): Promise<boolean> {
    return this.checkRole({ user: params.user, required: UserRole.USER })
  }

  static async checkRoleView(params: { user: User }): Promise<boolean> {
    return this.checkRole({ user: params.user, required: UserRole.VIEW })
  }
  /* -------------------------------------------------------------------------- */
  /* LOGIN / TOKEN                                                              */
  /* -------------------------------------------------------------------------- */
  static async obtenerToken(params: ObtenerTokenParams) {
    const { email, password, ip } = params

    if (!email || !password) {
      throw new Exception('Credenciais inválidas', { status: 401 })
    }

    const user = await User.query().where('email', email).orWhere('username', email).first()

    if (!user || !user.active) {
      throw new Exception('Credenciais inválidas', { status: 401 })
    }

    const authUser = await User.verifyCredentials(email, password)

    if (!authUser) {
      throw new Exception('Credenciais inválidas', { status: 401 })
    }

    /* Revoga tokens antigos */
    const tokens = await User.accessTokens.all(authUser)
    await Promise.all(tokens.map((t) => User.accessTokens.delete(authUser, t.identifier)))

    /* Cria novo token */
    const token = await User.accessTokens.create(authUser)

    /* Atualiza metadados */
    authUser.merge({
      lastLoginAt: DateTime.now(),
      lastIp: ip ?? null,
    })
    await authUser.save()

    /* Cache */
    const serialized = authUser.serialize()

    await cache.set({
      key: `user:${authUser.id}`,
      value: serialized,
      ttl: '1h',
    })

    return {
      token,
      user: serialized,
    }
  }

  /* -------------------------------------------------------------------------- */
  /* LOGOUT / REVOGAÇÃO                                                         */
  /* -------------------------------------------------------------------------- */
  static async revokeAllTokens(user: User): Promise<boolean> {
    const tokens = await User.accessTokens.all(user)

    await Promise.all(tokens.map((t) => User.accessTokens.delete(user, t.identifier)))

    await cache.delete({ key: `user:${user.id}` })

    return true
  }

  /* -------------------------------------------------------------------------- */
  /* CREATE USER                                                                */
  /* -------------------------------------------------------------------------- */
  static async db_store(payload: UserEntity) {
    const user = await User.create(payload)

    await cache.delete({ key: 'users' })

    return user.serialize()
  }

  /* -------------------------------------------------------------------------- */
  /* UPDATE USER                                                                */
  /* -------------------------------------------------------------------------- */
  static async db_update(user: User, payload: UserEntityUpdate) {
    user.merge(payload)
    await user.save()

    const serialized = user.serialize()

    await cache.set({
      key: `user:${user.id}`,
      value: serialized,
      ttl: '1h',
    })

    await cache.delete({ key: 'users' })

    return serialized
  }

  /* -------------------------------------------------------------------------- */
  /* DELETE USER                                                                */
  /* -------------------------------------------------------------------------- */
  static async db_delete(user: User) {
    await cache.delete({ key: `user:${user.id}` })
    await cache.delete({ key: 'users' })

    await user.delete()

    return true
  }

  /* -------------------------------------------------------------------------- */
  /* LIST USERS                                                                 */
  /* -------------------------------------------------------------------------- */
  static async db_list() {
    const cached = await cache.get<User[]>({ key: 'users' })
    if (cached) return cached

    const users = await User.all()
    const serialized = users.map((u) => u.serialize())

    await cache.set({
      key: 'users',
      value: serialized,
      ttl: '10m',
    })

    return serialized
  }

  static async passwordResetRequest(email: string, ip?: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase()
    const requesterIp = ip ?? 'unknown'

    const blockKey = this.resetBlockKey(normalizedEmail, requesterIp)
    const blockedUntil = await cache.get<number>({ key: blockKey })

    if (blockedUntil && Date.now() < blockedUntil) {
      return false
    }

    const attemptsKey = this.resetAttemptKey(normalizedEmail, requesterIp)
    const attempts = (await cache.get<number>({ key: attemptsKey })) ?? 0

    if (attempts >= AuthService.MAX_ATTEMPTS) {
      const blockedUntilTs = Date.now() + AuthService.BLOCK_TIME

      await cache.set({
        key: blockKey,
        value: blockedUntilTs,
        ttl: `${AuthService.BLOCK_TIME / 1000}s`,
      })

      const user = await User.query().where('email', normalizedEmail).first()

      if (user) {
        await AppEmailService.send({
          to: user.email,
          subject: 'Tentativas excessivas de recuperação de senha',
          isHtml: true,
          body: `
          <p>Olá ${user.name},</p>
          <p>Detectamos múltiplas tentativas de redefinição de senha.</p>
          <p><strong>IP:</strong> ${requesterIp}</p>
          <p><strong>Horário:</strong> ${DateTime.now().toFormat('dd/MM/yyyy HH:mm')}</p>
          <p>Se não foi você, recomendamos alterar sua senha imediatamente.</p>
        `,
        })
      }

      return false
    }

    await cache.set({
      key: attemptsKey,
      value: attempts + 1,
      ttl: `${AuthService.RATE_LIMIT_WINDOW / 1000}s`,
    })

    const user = await User.query().where('email', normalizedEmail).first()

    if (!user) return false

    const token = randomBytes(32).toString('hex')
    const hash = createHash('sha256').update(token).digest('hex')

    await cache.set({
      key: `reset:${normalizedEmail}`,
      value: hash,
      ttl: AuthService.RESET_TTL,
    })

    await AppEmailService.send({
      to: user.email,
      subject: 'Recuperação de senha',
      isHtml: true,
      body: `
      <p>Olá ${user.name},</p>
      <p>Use o código abaixo para redefinir sua senha:</p>
      <p><strong>${token}</strong></p>
      <p>Válido por 15 minutos.</p>
    `,
    })
    return true
  }

  static async passwordReset(params: PasswordResetParams): Promise<boolean> {
    const { email, token, password, ip } = params
    const normalizedEmail = email.trim().toLowerCase()
    const requesterIp = ip ?? 'unknown'

    const key = `reset:${normalizedEmail}`
    const storedHash = await cache.get<string>({ key })

    if (!storedHash) {
      throw new Exception('Token inválido ou expirado', { status: 400 })
    }

    const providedHash = createHash('sha256').update(token).digest('hex')

    if (!timingSafeEqual(Buffer.from(storedHash), Buffer.from(providedHash))) {
      throw new Exception('Token inválido ou expirado', { status: 400 })
    }

    const user = await User.query().where('email', normalizedEmail).firstOrFail()

    user.password = password
    await user.save()

    // limpa tudo
    await cache.delete({ key })
    await cache.delete({ key: this.resetAttemptKey(normalizedEmail, requesterIp) })
    await cache.delete({ key: this.resetBlockKey(normalizedEmail, requesterIp) })

    await AppEmailService.send({
      to: user.email,
      subject: 'Senha alterada com sucesso',
      isHtml: true,
      body: `
      <p>Olá ${user.name},</p>
      <p>Sua senha foi alterada com sucesso.</p>
      <p><strong>IP:</strong> ${requesterIp}</p>
      <p><strong>Data:</strong> ${DateTime.now().toFormat('dd/MM/yyyy HH:mm')}</p>
      <p>Se não foi você, entre em contato imediatamente.</p>
    `,
    })
    return true
  }

  static async emailverifyRequest(user: User, ip?: string): Promise<boolean> {
    const normalizedEmail = user.email.trim().toLowerCase()
    const requesterIp = ip ?? 'unknown'

    const blockKey = this.verifyBlockKey(normalizedEmail, requesterIp)
    const blockedUntil = await cache.get<number>({ key: blockKey })

    if (blockedUntil && Date.now() < blockedUntil) {
      return false
    }

    const attemptsKey = this.verifyAttemptKey(normalizedEmail, requesterIp)
    const attempts = (await cache.get<number>({ key: attemptsKey })) ?? 0

    if (attempts >= this.MAX_ATTEMPTS) {
      const blockedUntilTs = Date.now() + this.BLOCK_TIME

      await cache.set({
        key: blockKey,
        value: blockedUntilTs,
        ttl: `${this.BLOCK_TIME / 1000}s`,
      })

      return false
    }

    await cache.set({
      key: attemptsKey,
      value: attempts + 1,
      ttl: `${this.RATE_LIMIT_WINDOW / 1000}s`,
    })

    const token = randomBytes(32).toString('hex')
    const hash = createHash('sha256').update(token).digest('hex')

    // Armazena o hash do token no cache associado ao e-mail
    await cache.set({
      key: `verify_email:${normalizedEmail}`,
      value: hash,
      ttl: this.VERIFY_TTL,
    })

    await AppEmailService.send({
      to: user.email,
      subject: 'Verificação de E-mail',
      isHtml: true,
      body: `
      <p>Olá ${user.name},</p>
      <p>Por favor, use o código abaixo para verificar seu endereço de e-mail:</p>
      <p><strong>${token}</strong></p>
      <p>Este código é válido por 24 horas.</p>
      <p>Se você não criou uma conta, ignore este e-mail.</p>
    `,
    })

    return true
  }

  static async emailVerify(email: string, token: string, ip?: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase()
    const requesterIp = ip ?? 'unknown'

    const key = `verify_email:${normalizedEmail}`
    const storedHash = await cache.get<string>({ key })

    if (!storedHash) {
      throw new Exception('Token de verificação inválido ou expirado', { status: 400 })
    }

    const providedHash = createHash('sha256').update(token).digest('hex')

    if (!timingSafeEqual(Buffer.from(storedHash), Buffer.from(providedHash))) {
      throw new Exception('Token de verificação inválido ou expirado', { status: 400 })
    }

    const user = await User.query().where('email', normalizedEmail).firstOrFail()

    // Atualiza a data de verificação
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    // Limpa o cache após verificação bem-sucedida
    await cache.delete({ key })
    await cache.delete({ key: this.verifyAttemptKey(normalizedEmail, requesterIp) })
    await cache.delete({ key: this.verifyBlockKey(normalizedEmail, requesterIp) })

    return true
  }

  private static resetAttemptKey(email: string, ip: string) {
    return `reset:attempts:${email}:${ip}`
  }

  private static resetBlockKey(email: string, ip: string) {
    return `reset:blocked:${email}:${ip}`
  }
  private static verifyAttemptKey(email: string, ip: string) {
    return `verify:attempts:${email}:${ip}`
  }

  private static verifyBlockKey(email: string, ip: string) {
    return `verify:blocked:${email}:${ip}`
  }
}
