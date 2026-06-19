import { computed, ref } from 'vue'
import { __timedDebug__ } from './debug'

export const createSessionManager = ({
  api,
  tokenService,
  keys: { accessTokenResponseKey, refreshTokenResponseKey },
  callbacks: { onRestoreSession, onClearSession },
}) => {
  let initializationPromise = null
  let sessionVersion = 0

  let sub = null

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

    await tryRestoreSession('login')
  }

  const logout = async () => {
    __timedDebug__('🔐 logout....')

    const refreshToken = tokenService.getRefreshToken()

    try {
      await api.logout(refreshToken)
    } catch (error) {
      console.error('Ошибка при попытке разлогиниться на сервере:', error)
    } finally {
      clear()
    }
  }

  const tryRestoreSession = async origin => {
    const version = sessionVersion

    try {
      __timedDebug__(`⟳ restore session. Вызов из: "${origin}"`)

      if (!tokenService.isAccessTokenExist()) {
        __timedDebug__('Нет токена. Восстановить сессию невозможно')

        clear()
        return
      }

      if (!tokenService.isUserChanged(sub)) {
        __timedDebug__('Пользователь не изменился')

        return
      }

      sub = tokenService.getAccessTokenSub()

      __timedDebug__(`Новый sub: "${sub}". Запрос "/me"`)

      const me = await api.me()

      if (version !== sessionVersion) {
        __timedDebug__('Гонка восстановлений. Пропускаем восстановление')

        return
      }

      user.value = me.data
      onRestoreSession?.()
    } catch (error) {
      __timedDebug__('Ошибка в tryRestoreSession:', error)

      clear()
    } finally {
      isReady.value = true
    }
  }

  const clear = () => {
    sessionVersion++

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
        await tryRestoreSession('initialize')
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
