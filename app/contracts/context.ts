import AppKey from "#models/app_key"

declare module '@adonisjs/core/http' {
    export interface HttpContext {
        isFullAccess: boolean
        appKey?: AppKey
    }
}