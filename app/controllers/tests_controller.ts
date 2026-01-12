import { emailShemaTestValidator } from '#validators/app_test'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

export default class TestsController {
    async email_send_test({ request, response }: HttpContext) {
        try {
            const { toEmail, message, fromAddress, fromName } = await request.validateUsing(
                emailShemaTestValidator
            )

            await this.sendTestEmail({
                toEmail,
                emailBody: message || 'Este é um teste de email',
                fromAddress,
                fromName,
            })

            logger.info('Test email sent successfully', { to: toEmail })

            return response.ok({
                message: 'Email enviado com sucesso',
                to: toEmail,
            })
        } catch (error) {
            if (error.messages) {
                // Erro de validação do VineJS
                return response.badRequest({
                    message: 'Validation failed',
                    errors: error.messages,
                })
            }

            logger.error('Failed to send test email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            })

            return response.internalServerError({
                message: 'Falha ao enviar email. Verifique os logs para mais detalhes.',
            })
        }
    }

    private async sendTestEmail({
        toEmail,
        emailBody,
        fromAddress,
        fromName,
    }: {
        toEmail: string
        emailBody: string
        fromAddress?: string
        fromName?: string
    }): Promise<void> {
        await mail.send((message) => {
            const builder = message.to(toEmail).subject('Teste de Email').html(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
          </head>
          <body>
            <h1>${emailBody}</h1>
            <p>Este é um email de teste enviado pelo sistema.</p>
          </body>
        </html>
      `)
            if (fromAddress && fromName) {
                builder.from(fromAddress, fromName)
            } else if (fromAddress) {
                builder.from(fromAddress)
            }
        })
    }
}