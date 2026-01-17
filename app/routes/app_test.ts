import AppsController from '#controllers/apps_controller'
import TestsController from '#controllers/tests_controller'
import router from '@adonisjs/core/services/router'

router.group(() => {
    router.post('email', [TestsController, 'email_send_test'])
    router.get('modules', [AppsController, 'getModules'])
    router.resource('tiago', AppsController).apiOnly().as('apps.ti')
}).prefix('api/test')