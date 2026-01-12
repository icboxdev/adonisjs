import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const isProduction = env.get('NODE_ENV') === 'production'

const mailConfig = defineConfig({
  default: 'smtp',
  from: {
    address: env.get('MAIN_FROM_ADDRESS'),
    name: env.get('MAIN_FROM_NAME'),
  },
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_PORT') === 465,
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME'),
        pass: env.get('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: isProduction,
      },
      pool: isProduction,
      maxConnections: isProduction ? 5 : 1,
      maxMessages: isProduction ? 100 : 10,
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}