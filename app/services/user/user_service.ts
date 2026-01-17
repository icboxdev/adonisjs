import User from '#models/users/user'
import { UserRole } from '#services/auth/role_service'
import CacheService from '#start/cache'
import BusinessException from '#exceptions/business_exception'
import { DateTime } from 'luxon'

export interface UserEntity {
  isActive: boolean
  name: string
  email: string
  password: string
  role: string
  settings?: object | any | null
}

export interface UserEntitySetup {
  isActive?: boolean
  name: string
  email: string
  password: string
  password_confirmation: string
  role?: string
  emailVerifiedAt?: DateTime | null
  settings?: object | any | null
}

export interface UserEntityUpdate {
  isActive?: boolean
  name?: string
  email?: string
  password?: string
  role?: string
  settings?: object | any | null
}

export class UserService {
  static CACHE_LIST_KEY = 'users'

  /**
   * Busca usuário por ID (cacheado)
   */
  static async findById(id: number): Promise<User> {
    const cached = await CacheService.get<User>(this.CACHE_LIST_KEY)

    if (cached) {
      return cached as unknown as User
    }

    const user = await User.find(id)

    if (!user || user.isDeleted) {
      throw BusinessException.notFound(
        'Usuário não encontrado',
        'USER_NOT_FOUND'
      )
    }

    await CacheService.set({
      key: this.CACHE_LIST_KEY,
      value: user.serialize(),
      ttl: '1h',
    })

    return user
  }

  /**
   * Retorna dados do usuário autenticado
   */
  static async getMe(user: User): Promise<User> {
    const authUser = await this.findById(user.id)

    if (!this.isActive(authUser)) {
      throw BusinessException.forbidden(
        'Usuário inativo',
        'USER_INACTIVE'
      )
    }

    return authUser
  }

  /**
   * Cria usuário
   */
  static async create(payload: UserEntity) {
    const user = await User.create(payload)
    await CacheService.delete(this.CACHE_LIST_KEY)
    return user.serialize()
  }

  /**
   * Atualiza usuário
   */
  static async update(user: User, payload: UserEntityUpdate) {
    user.merge(payload)
    await user.save()

    await CacheService.deleteSingle(this.CACHE_LIST_KEY, user.id)
    return user.serialize()
  }

  /**
   * Remove usuário (soft/hard delete conforme model)
   */
  static async delete(user: User): Promise<boolean> {
    await CacheService.deleteSingle(this.CACHE_LIST_KEY, user.id)
    await user.delete()
    return true
  }

  /**
   * Verifica se precisa iniciar setup (super admin)
   */
  static async checkStartSetup(): Promise<boolean> {
    const existingSuperAdmin = await User.query()
      .where('is_deleted', false)
      .andWhere('role', UserRole.SUPER)
      .first()

    return !existingSuperAdmin
  }

  /**
   * Cria super administrador
   */
  static async createSuperAdmin(payload: UserEntitySetup): Promise<boolean> {
    const canCreate = await this.checkStartSetup()

    if (!canCreate) {
      throw BusinessException.conflict(
        'Já existe um super administrador cadastrado',
        'SUPER_ADMIN_EXISTS'
      )
    }

    if (payload.password !== payload.password_confirmation) {
      throw BusinessException.badRequest(
        'As senhas não coincidem',
        'PASSWORD_MISMATCH'
      )
    }

    await User.create({
      id: 1,
      isDeleted: false,
      isActive: true,
      role: UserRole.SUPER,
      emailVerifiedAt: DateTime.now(),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      settings: payload.settings ?? null,
    })

    await CacheService.delete(this.CACHE_LIST_KEY)
    return true
  }

  /**
   * Lista usuários (cacheado)
   */
  /**
   * Lista grupos (cacheado)
   */
  static async index(qs?: { field?: string, value?: string }): Promise<User[]> {
    const allowedFields = ['name', 'description', 'is_active']

    if (qs?.field && allowedFields.includes(qs.field)) {
      const query = User.query()

      if (qs?.field && qs?.value) {
        if (qs.field === 'is_active') {
          query.where(qs.field, qs.value === 'true')
        } else {
          query.whereILike(qs.field, `%${qs.value}%`)
        }
      }

      const groups = await query

      return groups
    } else {
      const cache = await CacheService.get<User[]>(this.CACHE_LIST_KEY)

      if (cache) {
        return cache as unknown as User[]
      }

      const groups = await User.all()
      await CacheService.set({
        key: this.CACHE_LIST_KEY,
        value: groups.map((g) => g.serialize()),
        ttl: '2h',
      })
      return groups
    }

  }
  /**
   * Verifica se usuário está ativo
   */
  static isActive(user: User): boolean {
    if (!user) {
      throw BusinessException.notFound(
        'Usuário não encontrado',
        'USER_NOT_FOUND'
      )
    }

    return user.isActive && !user.isDeleted
  }
}
