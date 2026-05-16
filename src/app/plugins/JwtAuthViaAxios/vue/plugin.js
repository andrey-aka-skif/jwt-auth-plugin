import { createJwtAuthViaAxios } from '../core/auth'
import { AUTH_KEY } from './symbols'

export default {
  install: async (app, { axiosInstance, router, api, config }) => {
    const auth = createJwtAuthViaAxios({
      axiosInstance,
      router,
      api,
      config,
    })
    app.provide(AUTH_KEY, auth)
  },
}
