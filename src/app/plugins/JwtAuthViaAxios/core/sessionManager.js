import { computed, ref } from 'vue'
import { AuthenticationError } from './AuthenticationError'
import { __timedDebug__ } from './debug'

export const createSessionManager = ({
  api,
  tokenService,
  onRestoreSession,
  onClearSession,
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
      onRestoreSession?.()
    } catch (error) {
      if (error instanceof AuthenticationError) {
        clear()
      }

      __timedDebug__(
        'Ошибка в restoreSession:',
        error,
        'error instanceof AuthenticationError:',
        error instanceof AuthenticationError
      )
    } finally {
      isReady.value = true
    }
  }

  const clear = () => {
    __timedDebug__()

    tokenService.clearTokens()
    user.value = null
    isReady.value = true

    onClearSession?.()
  }

  const initialize = async () => {
    if (initializationPromise) {
      return initializationPromise
    }

    __timedDebug__()

    initializationPromise = (async () => {
      try {
        __timedDebug__('Выполнение промиса в initialize')

        if (tokenService.isAccessTokenExist()) {
          await restoreSession()
        }
      } catch (error) {
        __timedDebug__(error)
      } finally {
        isReady.value = true
        __timedDebug__('finally. isReady.value:', isReady.value)
      }
    })()

    return initializationPromise
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
