import { computed, ref } from 'vue'
import { AuthenticationError } from './AuthenticationError'

export const createSessionManager = ({
  api,
  tokenService,
  onAuthenticated,
  onUnauthenticated,
  keys: { accessTokenResponseKey, refreshTokenResponseKey },
}) => {
  let initializationPromise = null

  const user = ref(null)
  const isReady = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  const login = async credentials => {
    const response = await api.login(credentials)

    tokenService.saveTokenPair({
      accessToken: response.data[accessTokenResponseKey],
      refreshToken: response.data[refreshTokenResponseKey],
    })

    await restoreSession()
  }

  const logout = async () => {
    const refreshToken = tokenService.getRefreshToken()

    try {
      await api.logout(refreshToken)
    } catch (error) {
      console.error('Ошибка при попытке разлогиниться на сервере:', error)
    } finally {
      clear()
    }
  }

  const restoreSession = async () => {
    try {
      const me = await api.me()
      user.value = me.data
      onAuthenticated?.()
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clear()
      }
    } finally {
      isReady.value = true
    }
  }

  const clear = () => {
    tokenService.clearTokens()
    user.value = null
    isReady.value = true

    onUnauthenticated?.()
  }

  const initialize = async () => {
    if (initializationPromise) {
      return initializationPromise
    }

    initializationPromise = async () => {
      try {
        if (tokenService.isAccessTokenExist()) {
          await restoreSession()
        }
      } finally {
        isReady.value = true
      }
    }
  }

  return {
    user,
    isAuthenticated,
    isReady,
    login,
    logout,
    restoreSession,
    clear,
    initialize,
  }
}
