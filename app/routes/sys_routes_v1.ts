import UsersController from '#controllers/users/users_controller'
import AppKeysController from '#controllers/app_keys_controller'

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.get('logs/access', [AppKeysController, 'get_loggers'])

    router
      .group(() => {
        router.get('/', [UsersController, 'index']).as('sys.users.index')
        router.get('/:id', [UsersController, 'show']).as('sys.users.show')
        router.delete('/:id/anonymize', [UsersController, 'destroy']).as('sys.users.anonymize')
        router.delete('/:id', [UsersController, 'destroy_register']).as('sys.users.delete_register')
        router.put('/:id', [UsersController, 'update']).as('sys.users.update')
        router.patch('/:id', [UsersController, 'update']).as('sys.users.update_patch')
        router.post('/', [UsersController, 'store']).as('sys.users.store')
      })
      .prefix('users')

    router.resource('keys', AppKeysController).apiOnly().as('sys.keys')
  })
  .prefix('api/sys')
  .middleware(middleware.privateKey())
