import { createJwtAuthViaAxios } from '../core/auth'
import { AUTH_KEY } from '../shared/symbols'

/**
 * Vue-плагин JWT-аутентификации. Регистрируется через `app.use(plugin, options)`
 * и делает сервис {@link import('../core/auth.js').Auth} доступным во всём
 * приложении (через `useAuth()`).
 */
export default {
  /**
   * @param {import('vue').App} app
   * @param {Object} options
   * @param {import('vue-router').Router} options.router Экземпляр vue-router.
   * @param {import('axios').AxiosInstance} options.axiosInstance Экземпляр axios.
   * @param {Object} [options.config] Конфигурация (мерджится с DEFAULT_CONFIG).
   */
  install: (app, { router, axiosInstance, config }) => {
    const auth = createJwtAuthViaAxios({
      router,
      axiosInstance,
      config,
    })
    app.provide(AUTH_KEY, auth)
  },
}
