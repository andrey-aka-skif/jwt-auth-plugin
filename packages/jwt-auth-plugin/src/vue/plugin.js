import { createJwtAuthViaAxios } from '../core/auth'
import { AUTH_KEY } from '../shared/symbols'

export default {
  install: (app, { router, axiosInstance, api, config }) => {
    const auth = createJwtAuthViaAxios({
      router,
      axiosInstance,
      api,
      config,
    })
    app.provide(AUTH_KEY, auth)
  },
}
