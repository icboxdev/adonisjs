/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from './kernel.js'
import AuthController from '#controllers/auth_controller'

import '#routes/auth_routes_v1'
import '#routes/sys_routes_v1'
import '#routes/app_test'
import '#routes/webhook_routes_v1'

router.where('id', router.matchers.number())

router.get('/', async () => {
  return { online: true }
})

transmit.registerRoutes((route) => {
  if (route.getPattern() === '/__transmit/events') {
    route.middleware(middleware.auth())
    return
  }
})

router
  .group(() => {
    router.post('create', [AuthController, 'createSuperUser'])
    router.get('check', [AuthController, 'checkStartSetup'])
  })
  .prefix('setup')

// router
//   .group(() => {
//     router.resource('users', UsersController).apiOnly().as('admin.users')
//     router.resource('keys', AppKeysController).apiOnly().as('admin.keys')
//   })
//   .prefix('admin')
//   // .middleware(middleware.authRole(UserRole.ADMIN))
