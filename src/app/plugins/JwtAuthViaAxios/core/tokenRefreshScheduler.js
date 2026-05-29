import { __timedDebug__ } from './utils'

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
    __timedDebug__()

    stop()

    refreshTimer = setInterval(tick, intervalMs)
  }

  const stop = () => {
    __timedDebug__()

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
