import { createAuth } from './auth'
import { AUTH_KEY } from './symbols'

export default {
  install: (app, { options, router }) => {
    const auth = createAuth({ ...options, router })
    app.provide(AUTH_KEY, auth)
  },
}
