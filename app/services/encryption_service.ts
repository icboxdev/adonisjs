import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import env from '#start/env'

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly IV_LENGTH = 16
  private static readonly KEY = Buffer.from(env.get('PUBLIC_KEY'), 'hex')

  /* =========================
   * HEX (COMPATÍVEL COM FRONT)
   * ========================= */

  static encrypt(data: string): string {
    const iv = randomBytes(this.IV_LENGTH)
    const cipher = createCipheriv(this.ALGORITHM, this.KEY, iv)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted,
    ].join(':')
  }

  static decrypt(payload: string): string {
    const [ivHex, tagHex, encrypted] = payload.split(':')

    if (!ivHex || !tagHex || !encrypted) {
      throw new Error('Invalid encrypted payload')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(tagHex, 'hex')

    const decipher = createDecipheriv(this.ALGORITHM, this.KEY, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /* =========================
   * BASE64 WRAPPERS
   * ========================= */

  static encryptBase64(data: string): string {
    const encrypted = this.encrypt(data)
    return Buffer.from(encrypted, 'utf8').toString('base64')
  }

  static decryptBase64(base64: string): string {
    const decoded = Buffer.from(base64, 'base64').toString('utf8')
    return this.decrypt(decoded)
  }

  /* =========================
   * KEY GENERATOR
   * ========================= */

  static generateKey(): string {
    return randomBytes(32).toString('hex')
  }
}
