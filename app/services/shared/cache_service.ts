import CacheService from '#start/cache'

async function invalidateUser(userId?: number): Promise<void> {
  const keys = ['users']
  if (userId) {
    keys.push(`user:${userId}`)
  }
  await CacheService.deleteMultiple(keys)
}

const userCacheService = {
  listKey: 'users',
  invalidateUser: invalidateUser,
  userKey: (userId: number) => `user:${userId}`,
}

export const sharedCache = {
  user: userCacheService,
}
