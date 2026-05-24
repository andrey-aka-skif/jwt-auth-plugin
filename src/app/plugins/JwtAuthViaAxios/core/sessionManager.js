import { computed, ref } from 'vue'

export const createSessionManager = ({
  api,
  tokenService,
  redirectOnNotAuthenticatedHandler,
  redirectOnAuthenticatedHandler,
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

    redirectOnAuthenticatedHandler?.()

    // Здесь ещё что-то про проактивную проверку токена
    // Но возможно, не здесь
  }

  const logout = async () => {
    console.log('logout...')
    redirectOnNotAuthenticatedHandler?.()
  }

  const restoreSession = async () => {
    try {
      const me = await api.me()
      user.value = me.data
      redirectOnAuthenticatedHandler?.()
    } catch {
      if(error instanceof AuthenticationError
      clear()
    }
  }

  const clear = () => {
    tokenService.clearTokens()
    user.value = null
    redirectOnNotAuthenticatedHandler?.()
  }

  return {
    user,
    isAuthenticated,
    isReady,
    login,
    logout,
    restoreSession,
    clear,
  }
}
