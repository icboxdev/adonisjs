import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Group from '#models/users/group'

export default class GroupAccessRole extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tableName: string

  @column()
  declare description: string | null

  @column()
  declare groupId: number

  @column()
  declare abilities: Record<string, [string, string]> | null

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}