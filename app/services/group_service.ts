import CacheService from '#start/cache'
import BusinessException from '#exceptions/business_exception'
import Group from '#models/users/group'

export type GroupPayloadCreate = {
  name: string
  description?: string | null
  isActive: boolean
}

export type GroupPayloadUpdate = {
  name?: string
  description?: string | null
  isActive?: boolean
}

export type GroupFetchIndex = {
  field?: string
  value?: string
}


export class GroupService {
  static CACHE_LIST_KEY = 'groups'

  /**
   * Lista grupos (cacheado)
   */
  static async index(qs?: GroupFetchIndex): Promise<Group[]> {
    const allowedFields = ['name', 'description', 'is_active']

    if (qs?.field && allowedFields.includes(qs.field)) {
      const query = Group.query()

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
      const cache = await CacheService.get<Group[]>(this.CACHE_LIST_KEY)

      if (cache) {
        return cache as unknown as Group[]
      }

      const groups = await Group.all()
      await CacheService.set({
        key: this.CACHE_LIST_KEY,
        value: groups.map((g) => g.serialize()),
        ttl: '2h',
      })
      return groups
    }


  }

  /**
   * Detalhe do grupo (cacheado)
   */
  static async show(params: { id: number }): Promise<Group> {
    const cacheKey = `group-${params.id}`
    const cache = await CacheService.get<any>(cacheKey)

    if (cache) {
      return cache as unknown as Group
    }

    const group = await Group.query()
      .where('id', params.id)
      .preload('accessRoles')
      .preload('users')
      .first()

    if (!group) {
      throw BusinessException.notFound(
        'Grupo não encontrado',
        'GROUP_NOT_FOUND'
      )
    }

    await CacheService.set({
      key: cacheKey,
      value: group.serialize(),
      ttl: '2h',
    })

    return group
  }

  /**
   * Cria grupo
   */
  static async store(payload: GroupPayloadCreate): Promise<Group> {
    const group = await Group.create({
      name: payload.name,
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
    })

    await CacheService.delete(this.CACHE_LIST_KEY)
    return group
  }

  /**
   * Atualiza grupo
   */
  static async update(
    params: { id: number },
    payload: GroupPayloadUpdate
  ): Promise<Group> {
    const group = await Group.find(params.id)

    if (!group) {
      throw BusinessException.notFound(
        'Grupo não encontrado',
        'GROUP_NOT_FOUND'
      )
    }

    group.merge({
      name: payload.name ?? group.name,
      description: payload.description ?? group.description,
      isActive: payload.isActive ?? group.isActive,
    })

    await group.save()
    await CacheService.deleteSingle(this.CACHE_LIST_KEY, params.id)
    return group
  }

  /**
   * Remove grupo
   */
  static async delete(params: { id: number }): Promise<void> {
    const group = await Group.find(params.id)

    if (!group) {
      throw BusinessException.notFound(
        'Grupo não encontrado',
        'GROUP_NOT_FOUND'
      )
    }

    await group.delete()
    await CacheService.deleteSingle(this.CACHE_LIST_KEY, params.id)
  }

  /**
   * Ativa / desativa grupo
   */
  static async toggleStatus(params: { id: number }): Promise<Group> {
    const group = await Group.find(params.id)

    if (!group) {
      throw BusinessException.notFound(
        'Grupo não encontrado',
        'GROUP_NOT_FOUND'
      )
    }

    group.isActive = !group.isActive
    await group.save()
    await CacheService.deleteSingle(this.CACHE_LIST_KEY, params.id)

    return group
  }
}
