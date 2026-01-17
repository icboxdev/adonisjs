import { EmailService } from '#services/app_email_service'
import { RoleService } from '#services/role_service'
import { sendEmailValidator } from '#validators/app_validators'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class AppsController {

    async getModules({ response }: HttpContext) {
        const modules = await RoleService.getModules()
        return response.ok(modules)
    }

    async sendEmail({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(sendEmailValidator)
            await EmailService.send(payload)
            logger.info('Email sent successfully', {
                to: payload.to,
                subject: payload.subject,
            })
            return response.ok({
                message: 'Email enviado com sucesso',
                to: payload.to,
                subject: payload.subject,
            })
        } catch (error) {
            if (error.messages) {
                return response.badRequest({
                    message: 'Validation failed',
                    errors: error.messages,
                })
            }

            logger.error('Failed to send email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            })
            return response.internalServerError({
                message: 'Falha ao enviar email. Tente novamente mais tarde.',
            })
        }
    }
}
