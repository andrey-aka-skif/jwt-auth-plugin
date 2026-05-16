import { DEFAULT_CONFIG } from './options'
import { AUTH_KEY } from './symbols'

export const createAuth = (options = { DEFAULT_CONFIG }) => {
  if (!options.router) {
    throw new Error('Не указан роутер')
  }

  if (!options.api) {
    throw new Error('Не указан API')
  }

  const router = options.router
  const api = options.api
  const config = { ...DEFAULT_CONFIG, ...options.config }

  console.log(router, api, config)

  const login = async credentials => {
    // Implement login logic here
  }

  const logout = async () => {
    // Implement logout logic here
  }

  const isAuthenticated = () => {
    // Implement authentication check logic here
  }

  const checkAndRefreshToken = async () => {
    console.log('Checking and refreshing token...')

    // Implement token refresh logic here
  }

  const auth = {
    login,
    logout,
    isAuthenticated,
    checkAndRefreshToken,

    install: app => {
      auth.checkAndRefreshToken()
      app.provide(AUTH_KEY, auth)
    },
  }
}
