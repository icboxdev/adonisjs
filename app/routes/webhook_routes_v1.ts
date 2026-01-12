import WebhooksController from '#controllers/webhooks_controller'
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.post('chat', [WebhooksController, 'chat'])
  })
  .prefix('webhook')
