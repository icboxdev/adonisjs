import cache from '@adonisjs/cache/services/main'

interface CacheOptions {
  key: string
  ttl?: string
}

interface CacheSetOptions<T> extends CacheOptions {
  value: T
}

export default class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    return await cache.get<T>({ key })
  }

  static async set<T>(options: CacheSetOptions<T>): Promise<void> {
    await cache.set({
      key: options.key,
      value: options.value,
      ttl: options.ttl || '1h',
    })
  }

  static async delete(key: string): Promise<void> {
    await cache.delete({ key })
  }

  static async deleteMultiple(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)))
  }
}
