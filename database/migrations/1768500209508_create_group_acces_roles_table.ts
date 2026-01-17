import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'group_access_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('table_name').notNullable()
      table.string('description').nullable()
      table
        .integer('group_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('groups')
        .onDelete('CASCADE')
      table.jsonb('abilities').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['table_name', 'group_id'])
      
      table.comment('Permissões de grupo')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}