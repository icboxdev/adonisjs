import type { HttpContext } from '@adonisjs/core/http'

export default class WebhooksController {

    async chat(ctx: HttpContext) {
        const body = ctx.request.body()
        console.log(body)
        return 'ok'
    }
    

}
