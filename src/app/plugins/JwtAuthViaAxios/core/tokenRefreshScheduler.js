export const createTokenRefreshScheduler = ({
  tokenService,
  sessionManager,
  api,
}) => {
  let refreshTimer = null
  let initializationPromise = null

  const restoreSession = async () => {
    try {
      await tokenService.ensureFreshTokens()

      const me = await api.me()

      sessionManager.setUser(me.data)

      return true
    } catch {
      sessionManager.clear()

      return false
    }
  }

  const initialize = async () => {
    if (initializationPromise) {
      return initializationPromise
    }

    initializationPromise = restoreSession().finally(() => {
      sessionManager.setReady(true)
    })

    return initializationPromise
  }

  const startProactiveRefresh = () => {
    stopProactiveRefresh()

    refreshTimer = setInterval(async () => {
      try {
        await tokenService.ensureFreshTokens()
      } catch {
        sessionManager.clear()
      }
    }, 1000 * 30)
  }

  const stopProactiveRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  return {
    initialize,
    restoreSession,
    startProactiveRefresh,
    stopProactiveRefresh,
  }
}
