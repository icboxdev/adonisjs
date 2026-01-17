import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'preferences'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').unique().index()
      table.jsonb('value').nullable() 
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      table.comment('Configurações do sistema')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}