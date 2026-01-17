import vine from '@vinejs/vine'

/**
 * Criação de grupo
 */
export const groupCreateValidator = vine.compile(
    vine.object({
        name: vine
            .string()
            .trim()
            .minLength(3)
            .maxLength(100),

        description: vine
            .string()
            .trim()
            .maxLength(255)
            .optional(),

        isActive: vine
            .boolean()
    })
)

/**
 * Atualização de grupo
 */
export const groupUpdateValidator = vine.compile(
    vine.object({
        name: vine
            .string()
            .trim()
            .minLength(3)
            .maxLength(100)
            .optional(),

        description: vine
            .string()
            .trim()
            .maxLength(255)
            .nullable()
            .optional(),

        isActive: vine
            .boolean()
            .optional(),
    })
)
