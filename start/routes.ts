import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from './kernel.js'
import AuthController from '#controllers/auth/auth_controller'
import PreferencesController from '#controllers/preferences_controller'

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

  router.group(() => {
    router.get('/:name',[PreferencesController, 'show'])
    router.get('/', [PreferencesController, 'index'])
    router.post('/', [PreferencesController, 'store'])
    router.put('/:name', [PreferencesController, 'update'])
    router.delete('/:name', [PreferencesController, 'delete'])
  }).prefix('api/v1/preference')


import '#routes/auth_routes_v1'
import '#routes/sys_routes_v1'
import '#routes/app_test'
import '#routes/webhook_routes_v1'
import '#routes/system_app_routes'