import TestsController from '#controllers/tests_controller'
import router from '@adonisjs/core/services/router'

router.group(() => {
    router.post('email', [TestsController, 'email_send_test'])
}).prefix('api/test')