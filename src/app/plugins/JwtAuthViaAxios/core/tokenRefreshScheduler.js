import { __timedDebug__ } from './debug'

export const createTokenRefreshScheduler = ({
  tokenService,
  constants: { intervalMs },
}) => {
  let refreshTimer = null

  const tick = async () => {
    try {
      __timedDebug__('⏱')

      await tokenService.tryRefreshTokens()
    } catch {
      __timedDebug__('⚠ Шедулер перехватил ошибку')
      // nothing
    }
  }

  const start = () => {
    stop()

    __timedDebug__('⏵ планировщика рефреша токенов')

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
