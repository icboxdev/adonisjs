import vine from '@vinejs/vine'

export const appKeyStoreValidator = vine.compile(
  vine.object({
    description: vine.string().minLength(3).maxLength(255).trim(),
    value: vine.string().minLength(1).trim().optional(),
    isActive: vine.boolean(),
    daysExpires: vine.number(),
    permission: vine.array(vine.string()).optional(),
  })
)

export const appKeyUpdateValidator = vine.compile(
  vine.object({
    daysExpires: vine.number().optional(),
    description: vine.string().minLength(3).maxLength(255).trim().optional(),
    permission: vine.array(vine.string()).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const sendEmailValidator = vine.compile(
  vine.object({
    to: vine.string().email().trim(),
    subject: vine.string().minLength(3).maxLength(255).trim(),
    body: vine.string().minLength(1).trim(),
    cc: vine.array(vine.string().email()).optional(),
    bcc: vine.array(vine.string().email()).optional(),
    from: vine
      .object({
        address: vine.string().email().trim(),
        name: vine.string().minLength(1).trim().optional(),
      })
      .optional(),
    replyTo: vine.string().email().trim().optional(),
    attachments: vine
      .array(
        vine.object({
          filename: vine.string().minLength(1),
          path: vine.string().url().optional(),
          content: vine.string().optional(),
          contentType: vine.string().optional(),
        })
      )
      .optional(),
    isHtml: vine.boolean().optional(),
    priority: vine.enum(['high', 'normal', 'low'] as const).optional(),
  })
)
