import { __timedDebug__ } from './debug'

export const createTokenRefreshScheduler = ({
  constants: { intervalMs, checkJitterPercent },
  callbacks: { onSchedulerTick },
}) => {
  let refreshTimer = null

  const getRandomDelay = (intervalMs, jitterPercent) => {
    const jitter = 1 + (Math.random() * 2 - 1) * jitterPercent
    return Math.floor(intervalMs * jitter)
  }

  const tick = async () => {
    try {
      await onSchedulerTick?.()
    } catch (error) {
      __timedDebug__('⚠ Шедулер перехватил ошибку', error)
      // nothing
    }
  }

  const start = () => {
    stop()

    __timedDebug__('⏵ Scheduler...')

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
