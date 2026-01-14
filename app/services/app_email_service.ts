import mail from '@adonisjs/mail/services/main'
import type { Message } from '@adonisjs/mail'

export interface EmailPayload {
  to: string
  subject: string
  body: string
  cc?: string[]
  bcc?: string[]
  from?: {
    address: string
    name?: string
  }
  replyTo?: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: string
    contentType?: string
  }>
  isHtml?: boolean
  priority?: 'high' | 'normal' | 'low'
}

export class EmailService {
  static async send(payload: EmailPayload): Promise<void> {
    await mail.send((message) => {
      EmailService.buildMessage(message, payload)
    })
  }

  private static buildMessage(message: Message, payload: EmailPayload): void {
    message.to(payload.to).subject(payload.subject)

    if (payload.isHtml) {
      message.html(this.wrapHtmlTemplate(payload.body))
    } else {
      message.text(payload.body)
    }

    if (payload.from) {
      message.from(payload.from.address, payload.from.name)
    }

    if (payload.replyTo) {
      message.replyTo(payload.replyTo)
    }

    if (payload.cc && payload.cc.length > 0) {
      message.cc(payload.cc)
    }

    if (payload.bcc && payload.bcc.length > 0) {
      message.bcc(payload.bcc)
    }

    if (payload.priority) {
      message.priority(payload.priority)
    }

    if (payload.attachments && payload.attachments.length > 0) {
      this.addAttachments(message, payload.attachments)
    }
  }

  private static addAttachments(
    message: Message,
    attachments: EmailPayload['attachments']
  ): void {
    attachments?.forEach((attachment) => {
      if (attachment.path) {
        message.attach(attachment.path, {
          filename: attachment.filename,
          contentType: attachment.contentType,
        })
      } else if (attachment.content) {
        message.attachData(Buffer.from(attachment.content, 'base64'), {
          filename: attachment.filename,
          contentType: attachment.contentType,
        })
      }
    })
  }

  private static wrapHtmlTemplate(body: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${body}
        </body>
      </html>
    `
  }
}
/*

1. Email HTML Simples

curl -X POST http://localhost:3333/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@example.com",
    "subject": "Bem-vindo ao Sistema",
    "body": "<h1>Olá!</h1><p>Bem-vindo ao nosso sistema.</p>",
    "isHtml": true
  }'

2. Email de Texto com CC e BCC

curl -X POST http://localhost:3333/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@example.com",
    "subject": "Relatório Mensal",
    "body": "Segue em anexo o relatório mensal.",
    "cc": ["gerente@example.com"],
    "bcc": ["arquivo@example.com"],
    "priority": "high"
  }'


3. Email com From Customizado e Reply-To
curl -X POST http://localhost:3333/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "cliente@example.com",
    "subject": "Atendimento ao Cliente",
    "body": "<p>Olá, como podemos ajudar?</p>",
    "isHtml": true,
    "from": {
      "address": "atendimento@zabe.com.br",
      "name": "Equipe de Atendimento"
    },
    "replyTo": "resposta@zabe.com.br"
  }'

4. Email com Anexo (Base64)
curl -X POST http://localhost:3333/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@example.com",
    "subject": "Documento Anexado",
    "body": "Segue documento solicitado.",
    "attachments": [
      {
        "filename": "documento.pdf",
        "content": "JVBERi0xLjQKJeLjz9M...",
        "contentType": "application/pdf"
      }
    ]
  }'
  
*/