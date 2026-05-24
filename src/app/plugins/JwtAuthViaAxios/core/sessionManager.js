import { computed, ref } from 'vue'

export const createSessionManager = ({
  api,
  tokenService,
  onClearSession,
  onRestoreSession,
  accessTokenResponseKey,
  refreshTokenResponseKey,
}) => {
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
      onRestoreSession?.()
    } catch {
      clear()
    } finally {
      isReady.value = true
    }
  }

  const clear = () => {
    tokenService.clearTokens()
    user.value = null
    isReady.value = true

    onClearSession?.()
  }

  const onAuthFailure = () => {
    clear()
  }

  return {
    user,
    isAuthenticated,
    isReady,
    login,
    logout,
    restoreSession,
    clear,
    onAuthFailure,
  }
}
