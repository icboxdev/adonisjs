import db from '@adonisjs/lucid/services/db'
import string from '@adonisjs/core/helpers/string'
import env from '#start/env' // Importante para pegar o nome do banco no MySQL

export class RoleService {

  static async getModules(ignoredTables: string[] = []) {
    const systemTables = [
      'adonis_schema',
      'adonis_schema_versions',
      'schema_migrations',
      'migrations',
      'auth_deleteds',
      ...ignoredTables
    ]

    let tablesData: { name: string, comment: string | null }[] = []
    const connection = db.connection()

    // --- Lógica para POSTGRESQL ---
    if (connection.dialect.name === 'postgres') {
      // Query avançada para pegar nome e comentário no PG
      const query = `
        SELECT 
          relname as name, 
          obj_description(pg_class.oid) as comment
        FROM pg_class
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = 'public' 
          AND relkind = 'r';
      `
      const result = await db.rawQuery(query)
      tablesData = result.rows
    }

    // --- Lógica para MYSQL ---
    else {
      const dbName = env.get('DB_DATABASE') // Nome do banco no .env
      const query = `
        SELECT 
          TABLE_NAME as name, 
          TABLE_COMMENT as comment 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
      `
      // O MySQL retorna [[rows], [fields]]
      const result = await db.rawQuery(query, [dbName])
      tablesData = result[0]
    }

    // --- Processamento Final ---
    const modules = tablesData
      .filter((t) => !systemTables.includes(t.name))
      .map((t) => {
        // Lógica Principal:
        // SE tiver comentário no banco -> Usa o comentário como Label
        // SE NÃO tiver -> Formata o nome da tabela (Ex: users -> User)

        let label = t.comment

        if (!label || label.trim() === '') {
          label = string.capitalCase(string.singular(t.name))
        }

        return {
          label: label,      // "Gerenciamento de Usuários" ou "User"
          value: t.name      // "users"
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    return modules
  }
}