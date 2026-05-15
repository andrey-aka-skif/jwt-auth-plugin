import { createAuth } from './createAuth'
import { AUTH_KEY } from './symbols'

export default {
  install: (app, options) => {
    const auth = createAuth(options)
    app.provide(AUTH_KEY, auth)
  },
}
