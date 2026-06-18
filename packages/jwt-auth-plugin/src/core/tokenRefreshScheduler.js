import { __timedDebug__ } from './debug'

export const createTokenRefreshScheduler = ({
  tokenService,
  constants: { intervalMs, checkJitterPercent },
}) => {
  let refreshTimer = null

  const getRandomDelay = (intervalMs, jitterPercent) => {
    const jitter = 1 + (Math.random() * 2 - 1) * jitterPercent
    return Math.floor(intervalMs * jitter)
  }

  const tick = async () => {
    try {
      __timedDebug__('⏱')

      await tokenService.tryRefreshTokens('scheduler')
    } catch {
      __timedDebug__('⚠ Шедулер перехватил ошибку')
      // nothing
    }
  }

  const start = () => {
    stop()

    __timedDebug__('⏵ планировщика рефреша токенов')

    // const delay = getRandomDelay(intervalMs, checkJitterPercent)
    const delay = intervalMs
    refreshTimer = setInterval(tick, delay)
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
