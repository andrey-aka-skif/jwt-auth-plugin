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
    const refreshToken = tokenService.getRefreshToken()

    try {
      await api.logout(refreshToken)
    } catch (error) {
      console.error('Ошибка при попытке разлогиниться на сервере:', error)
    } finally {
      clear()
    }
  }

  let restoreId = 0

  // TODO: проверить, что пользователь не изменился, через чтение токена и декодирование,
  // чтобы не делать лишний запрос на /me
  const tryRestoreSession = async origin => {
    const currentId = ++restoreId
    const version = sessionVersion

    __timedDebug__(`Восстановление сессии вызвано в ${origin}`)

    __timedDebug__('restore start _____', currentId, '_____')

    try {
      __timedDebug__('⟳ restore session...')

      if (!tokenService.isAccessTokenExist()) {
        __timedDebug__(
          'Токен отсутствует в хранилище. Восстановить сессию невозможно'
        )

        clear()
        return
      }

      if (!tokenService.isUserChanged(sub)) {
        return
      }

      sub = tokenService.getAccessTokenSub()

      __timedDebug__('Изменился пользователь. Новый sub:', sub)

      if (version !== sessionVersion) {
        return
      }

      __timedDebug__('restore finish _____', currentId, '_____')

      const me = await api.me()
      user.value = me.data
      onRestoreSession?.()
    } catch (error) {
      __timedDebug__('Ошибка в tryRestoreSession:', error)

      clear()
    } finally {
      __timedDebug__('clear from restore _____', currentId, '_____')

      isReady.value = true
    }
  }

  const clear = () => {
    __timedDebug__('🗑 clear session...')
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
        __timedDebug__('Стартовая инициализация...')

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
