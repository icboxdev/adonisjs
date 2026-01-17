import { EncryptionService } from '#services/encryption_service'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

/**
 * Custom decryption rule for encrypted fields
 */
const decryptRule = vine.createRule((value, _options, field) => {
  if (typeof value !== 'string') {
    field.report('The {{ field }} field must be a string', 'decrypt', field)
    return
  }

  try {
    const decrypted = EncryptionService.decrypt(value)
    field.mutate(decrypted, field)
  } catch (error) {
    field.report('The {{ field }} field contains invalid encrypted data', 'decrypt', field)
  }
})

export const AuthRequestEmailValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail().trim(),
  })
)

export const AuthPasswordResetValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail().trim(),
    token: vine.string().trim(),
    password: vine.string().minLength(8).maxLength(32).trim().confirmed(),
  })
)


/**
 * Schema for encrypted login data
 */
export const AuthLoginValidator = vine.compile(
  vine.object({
    username: vine.string().use(decryptRule()).email().normalizeEmail().trim(),
    password: vine.string().use(decryptRule()).minLength(8).maxLength(32).trim(),
  })
)

export const AuthPasswordUpdateValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(8).maxLength(32).trim(),
    password: vine.string().minLength(8).maxLength(32).trim().confirmed(),
  })
)

export const AuthCreateSetupValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).maxLength(96).trim(),

    email: vine
      .string()
      .use(decryptRule())
      .email()
      .normalizeEmail()
      .trim(),

    password: vine
      .string()
      .use(decryptRule())
      .minLength(8)
      .maxLength(32),

    password_confirmation: vine
      .string()
      .use(decryptRule()),
  })
)

export const AuthCreateValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).maxLength(96).trim(),
    email: vine.string().email().normalizeEmail().trim(),
    password: vine.string().minLength(8).maxLength(32).trim().confirmed(),
    isActive: vine.boolean(),
    role: vine.enum(['user', 'admin', 'super'] as const),
    emailVerifiedAt: vine
      .date()
      .optional()
      .transform((value) => (value ? DateTime.fromJSDate(value) : null)),
  })
)

export const AuthUpdateValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).maxLength(96).trim().optional(),
    password: vine.string().minLength(8).maxLength(32).trim().confirmed().optional(),
    email: vine.string().email().normalizeEmail().trim().optional(),
    isActive: vine.boolean().optional(),
    role: vine.enum(['user', 'admin'] as const).optional(),
    lastIp: vine.string().trim().optional(),
    emailVerifiedAt: vine
      .date()
      .optional()
      .transform((value) => (value ? DateTime.fromJSDate(value) : null)),
    lastLoginAt: vine
      .date()
      .optional()
      .transform((value) => (value ? DateTime.fromJSDate(value) : null)),
  })
)
