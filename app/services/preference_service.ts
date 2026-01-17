import Preference, { PreferenceValue } from "#models/preference";
import CacheService from "#start/cache";


export class PreferenceService {
  private static CACHE_LIST_KEY = 'preferences'

  static async index(): Promise<Preference[]> {
    const cachePreferences = await CacheService.get<Preference[]>(this.CACHE_LIST_KEY)
    if (cachePreferences) {
      return cachePreferences
    }
    const preferences = await Preference.all()
    const preferencesSerialized = preferences.map((p) => (p.serialize()))
    CacheService.set({ key: this.CACHE_LIST_KEY, value: preferencesSerialized, ttl: '2h' })
    return preferences
  }

  static async show(params: { name: string }): Promise<Preference> {
    const preferenceKey = `preference-${params.name}`
    const cachePreference = await CacheService.get<Preference>(preferenceKey)
    if (cachePreference) {
      return cachePreference
    }
    const preference = await Preference.query().where('name', params.name).firstOrFail()
    CacheService.set({ key: preferenceKey, value: preference.serialize(), ttl: '2h' })
    return preference
  }

  static async update(params: { name: string, value: PreferenceValue }): Promise<Preference> {
    const preference = await Preference.query().where('name', params.name).firstOrFail()
    preference.value = params.value
    await preference.save()
    await CacheService.delete(`preference-${params.name}`)
    await CacheService.delete(this.CACHE_LIST_KEY)
    return preference
  }

  static async delete(params: { name: string }): Promise<void> {
    const preference = await Preference.query().where('name', params.name).firstOrFail()
    await preference.delete()
    await CacheService.delete(`preference-${params.name}`)
    await CacheService.delete(this.CACHE_LIST_KEY)
  }

  static async store(params: { name: string, value: PreferenceValue }): Promise<Preference> {
    const preference = await Preference.create(params)
    await CacheService.delete(this.CACHE_LIST_KEY)
    return preference
  }
}