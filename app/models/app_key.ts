import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AppKey extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare description: string | null

  @column()
  declare value: string

  @column()
  declare active: boolean

  @column({
    prepare: (value: string[] | null) => {
      if (!value) return null
      return JSON.stringify(value)
    },
    consume: (value: any) => {
      if (!value) return null
      try {
        return typeof value == 'string' ? JSON.parse(value) : value
      } catch {
        return []
      }
    }
  })
  declare permission: string[] | null

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}