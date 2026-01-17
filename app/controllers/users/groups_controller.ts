import type { HttpContext } from '@adonisjs/core/http'
import { GroupService } from '#services/group_service'
import { groupCreateValidator, groupUpdateValidator } from '#validators/group_validators'


export default class GroupsController {
    /**
     * GET /groups
     */
    async index({ response, request }: HttpContext) {
        const { field, value } = request.qs()
        if (field && value) {
            const groups = await GroupService.index({ field, value })
            return response.ok(groups)
        }
        const groups = await GroupService.index()
        return response.ok(groups)
    }

    /**
     * GET /groups/:id
     */
    async show({ params, response }: HttpContext) {
        const group = await GroupService.show({
            id: Number(params.id),
        })

        return response.ok(group)
    }

    /**
     * POST /groups
     */
    async store({ request, response }: HttpContext) {
        const payload = await request.validateUsing(groupCreateValidator)

        const group = await GroupService.store(payload)

        return response.created({
            message: 'Grupo criado com sucesso',
            group,
        })
    }

    /**
     * PUT /groups/:id
     */
    async update({ params, request, response }: HttpContext) {
        const payload = await request.validateUsing(groupUpdateValidator)

        const group = await GroupService.update(
            { id: Number(params.id) },
            payload
        )

        return response.ok({
            message: 'Grupo atualizado com sucesso',
            group,
        })
    }

    /**
     * DELETE /groups/:id
     */
    async destroy({ params, response }: HttpContext) {
        await GroupService.delete({
            id: Number(params.id),
        })

        return response.ok({
            message: 'Grupo removido com sucesso',
        })
    }

    /**
     * PATCH /groups/:id/toggle
     */
    async toggleStatus({ params, response }: HttpContext) {
        const group = await GroupService.toggleStatus({
            id: Number(params.id),
        })

        return response.ok({
            message: 'Status do grupo atualizado',
            group,
        })
    }
}
