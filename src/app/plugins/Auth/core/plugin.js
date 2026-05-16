import { createAuth } from './auth'
import { AUTH_KEY } from './symbols'

export default {
  install: (app, { router, api, config }) => {
    const auth = createAuth({ router, api, config })
    app.provide(AUTH_KEY, auth)
  },
}
