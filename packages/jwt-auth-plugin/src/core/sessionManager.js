import { computed, ref } from 'vue'
import { traceLog } from '@andrey-aka-skif/debug-utils'

export const createSessionManager = ({
  client,
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
    traceLog('🔐 login....')

    const response = await client.login(credentials)

    tokenService.saveTokenPair({
      accessToken: response.data[accessTokenResponseKey],
      refreshToken: response.data[refreshTokenResponseKey],
    })

    await tryRestoreSession('login')
  }

  const logout = async () => {
    traceLog('🔐 logout....')

    const refreshToken = tokenService.getRefreshToken()

    try {
      await client.logout(refreshToken)
    } catch (error) {
      console.error('Ошибка при попытке разлогиниться на сервере:', error)
    } finally {
      clear()
    }
  }

  const tryRestoreSession = async origin => {
    const version = sessionVersion

    try {
      traceLog(`⟳ restore session. Вызов из: "${origin}"`)

      if (!tokenService.isAccessTokenExist()) {
        traceLog('Нет токена. Восстановить сессию невозможно')

        clear()
        return
      }

      if (!tokenService.isUserChanged(sub)) {
        traceLog('Пользователь не изменился')

        return
      }

      sub = tokenService.getAccessTokenSub()

      traceLog(`Новый sub: "${sub}". Запрос "/me"`)

      const me = await client.me()

      if (version !== sessionVersion) {
        traceLog('Гонка восстановлений. Пропускаем восстановление')

        return
      }

      user.value = me.data
      onRestoreSession?.()
    } catch (error) {
      traceLog('Ошибка в tryRestoreSession:', error)

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
