import vine from '@vinejs/vine'

export const emailShemaTestValidator = vine.compile(
    vine.object(
        {
            toEmail: vine.string().email(),
            message: vine.string().optional(),
            fromAddress: vine.string().email().optional(),
            fromName: vine.string().optional(),
        }
    ))