import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import AppKeysController from '#controllers/app_keys_controller'
import UsersController from '#controllers/users/users_controller'
import GroupsController from '#controllers/users/groups_controller'

router
    .group(() => {
        router.resource('users', UsersController).apiOnly().as('api.users')
        router.resource('keys', AppKeysController).apiOnly().as('api.keys')
        router.resource('groups', GroupsController).apiOnly().as('api.groups')
    
    })
    .prefix('api/v1')
    .middleware(middleware.anonKey())