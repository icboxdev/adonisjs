// import { CacheSharedService } from '#services/shared/cache_service'
import CacheService from '#start/cache'

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockTimeMs: number
}

interface RateLimitCheck {
  identifier: string
  ip: string
  config: RateLimitConfig
}

interface RateLimitResult {
  allowed: boolean
  attemptsRemaining: number
  blockedUntil?: number
}

export class RateLimiter {
  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 min
    blockTimeMs: 30 * 60 * 1000, // 30 min
  }

  static async check(params: RateLimitCheck): Promise<RateLimitResult> {
    const { identifier, ip, config } = params
    const blockKey = this.getBlockKey(identifier, ip)
    const attemptsKey = this.getAttemptsKey(identifier, ip)

    const blockedUntil = await CacheService.get<number>(blockKey)
    if (blockedUntil && Date.now() < blockedUntil) {
      return {
        allowed: false,
        attemptsRemaining: 0,
        blockedUntil,
      }
    }

    const attempts = (await CacheService.get<number>(attemptsKey)) ?? 0

    if (attempts >= config.maxAttempts) {
      const blockedUntilTs = Date.now() + config.blockTimeMs

      await CacheService.set({
        key: blockKey,
        value: blockedUntilTs,
        ttl: `${config.blockTimeMs / 1000}s`,
      })

      return {
        allowed: false,
        attemptsRemaining: 0,
        blockedUntil: blockedUntilTs,
      }
    }

    return {
      allowed: true,
      attemptsRemaining: config.maxAttempts - attempts,
    }
  }

  static async recordAttempt(params: {
    identifier: string
    ip: string
    config: RateLimitConfig
  }): Promise<void> {
    const { identifier, ip, config } = params
    const attemptsKey = this.getAttemptsKey(identifier, ip)
    const attempts = (await CacheService.get<number>(attemptsKey)) ?? 0

    await CacheService.set({
      key: attemptsKey,
      value: attempts + 1,
      ttl: `${config.windowMs / 1000}s`,
    })
  }

  static async clearAttempts(identifier: string, ip: string): Promise<void> {
    const attemptsKey = this.getAttemptsKey(identifier, ip)
    const blockKey = this.getBlockKey(identifier, ip)
    await CacheService.deleteMultiple([attemptsKey, blockKey])
  }

  static getDefaultConfig(): RateLimitConfig {
    return { ...this.DEFAULT_CONFIG }
  }

  private static getAttemptsKey(identifier: string, ip: string): string {
    return `ratelimit:attempts:${identifier}:${ip}`
  }

  private static getBlockKey(identifier: string, ip: string): string {
    return `ratelimit:blocked:${identifier}:${ip}`
  }
}