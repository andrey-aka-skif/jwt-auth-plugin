import { computed, ref } from 'vue'

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
    const response = await client.login(credentials)

    tokenService.saveTokenPair({
      accessToken: response.data[accessTokenResponseKey],
      refreshToken: response.data[refreshTokenResponseKey],
    })

    await tryRestoreSession()
  }

  const logout = async () => {
    const refreshToken = tokenService.getRefreshToken()

    try {
      await client.logout(refreshToken)
    } catch (error) {
      console.error('Ошибка при попытке разлогиниться на сервере:', error)
    } finally {
      clear()
    }
  }

  const tryRestoreSession = async () => {
    const version = sessionVersion

    try {
      if (!tokenService.isAccessTokenExist()) {
        clear()
        return
      }

      if (!tokenService.isUserChanged(sub)) {
        return
      }

      sub = tokenService.getAccessTokenSub()

      const me = await client.me()

      if (version !== sessionVersion) {
        return
      }

      user.value = me.data
      onRestoreSession?.()
    } catch {
      clear()
    } finally {
      isReady.value = true
    }
  }

  const clear = () => {
    sessionVersion++

    sub = null
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
