import { computed, ref } from 'vue'
import { AuthenticationError } from './AuthenticationError'
import { __timedDebug__ } from './utils'

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
    __timedDebug__()

    const response = await api.login(credentials)

    tokenService.saveTokenPair({
      accessToken: response.data[accessTokenResponseKey],
      refreshToken: response.data[refreshTokenResponseKey],
    })

    await restoreSession()
  }

  const logout = async () => {
    __timedDebug__()

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
    __timedDebug__()

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
    __timedDebug__()

    tokenService.clearTokens()
    user.value = null
    isReady.value = true

    onUnauthenticated?.()
  }

  const initialize = async () => {
    if (initializationPromise) {
      return initializationPromise
    }

    __timedDebug__()

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
