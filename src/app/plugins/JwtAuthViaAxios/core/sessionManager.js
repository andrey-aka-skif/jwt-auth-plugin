import { computed, ref } from 'vue'
import { AuthenticationError } from '../errors/AuthenticationError'
import { __timedDebug__ } from './debug'

export const createSessionManager = ({
  api,
  tokenService,
  keys: { accessTokenResponseKey, refreshTokenResponseKey },
  callbacks: { onRestoreSession, onClearSession },
}) => {
  let initializationPromise = null

  const user = ref(null)

  const isReady = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  const login = async credentials => {
    __timedDebug__('🔐 login....')

    const response = await api.login(credentials)

    tokenService.saveTokenPair({
      accessToken: response.data[accessTokenResponseKey],
      refreshToken: response.data[refreshTokenResponseKey],
    })

    await tryRestoreSession()
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

  const tryRestoreSession = async () => {
    try {
      __timedDebug__('⟳ restore session...')

      if (!tokenService.isAccessTokenExist()) {
        __timedDebug__(
          'Токен отсутствует в хранилище. Восстановить сессию невозможно'
        )

        clear()
        return
      }

      const me = await api.me()
      user.value = me.data
      onRestoreSession?.()
    } catch (error) {
      __timedDebug__(
        'Ошибка в restoreSession:',
        error,
        'error instanceof AuthenticationError:',
        error instanceof AuthenticationError
      )

      if (error instanceof AuthenticationError) {
        __timedDebug__('_______Поймали AuthenticationError:', error)

        clear()
      }
    } finally {
      isReady.value = true
    }
  }

  const clear = () => {
    __timedDebug__('🗑 clear session...')

    tokenService.clearTokens()
    user.value = null
    isReady.value = true

    onClearSession?.()
  }

  const initialize = async () => {
    if (initializationPromise) {
      return initializationPromise
    }

    initializationPromise = (async () => {
      try {
        __timedDebug__('Стартовая инициализация...')

        await tryRestoreSession()
      } finally {
        isReady.value = true
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
    tryRestoreSession,
    clear,
    initialize,
  }
}
