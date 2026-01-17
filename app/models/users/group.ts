import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import UserGroup from '#models/users/user_group'
import GroupAccessRole from '#models/users/group_access_role'

export default class Group extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare isActive: boolean

  @hasMany(() => GroupAccessRole)
  declare accessRoles: HasMany<typeof GroupAccessRole>

  @hasMany(() => UserGroup)
  declare users: HasMany<typeof UserGroup>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}