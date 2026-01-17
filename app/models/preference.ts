import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type PreferenceValue = string | number | boolean | DateTime | Record<string, any> | null

export default class Preference extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({
    prepare: (value: PreferenceValue) => {
      if (value === null || value === undefined) return null

      if (value instanceof DateTime) {
        return JSON.stringify(value.toISO())
      }


      return JSON.stringify(value)
    },
    consume: (value: any) => {
      if (value === null || value === undefined) return null


      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {

          return value
        }
      }
      return value
    }
  })
  declare value: PreferenceValue

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
