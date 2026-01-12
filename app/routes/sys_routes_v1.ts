import UsersController from '#controllers/users_controller'
import AppKeysController from '#controllers/app_keys_controller'

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.get('logs/access', [AppKeysController, 'get_loggers'])
    router.resource('users', UsersController).apiOnly().as('sys.users')
    router.resource('keys', AppKeysController).apiOnly().as('sys.keys')
  })
  .prefix('api/sys')
  .middleware(middleware.privateKey())
