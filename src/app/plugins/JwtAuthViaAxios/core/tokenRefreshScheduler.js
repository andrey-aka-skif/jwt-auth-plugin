export const createTokenRefreshScheduler = ({ tokenService, intervalMs }) => {
  let refreshTimer = null

  const tick = async () => {
    try {
      if (tokenService.shouldRefreshToken()) {
        await tokenService.refreshTokens()
      }
    } catch {
      // nothing
    }
  }

  const start = () => {
    stop()

    refreshTimer = setInterval(tick, intervalMs)
  }

  const stop = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  return {
    start,
    stop,
  }
}
