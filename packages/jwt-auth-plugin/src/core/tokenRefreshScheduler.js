import { __timedDebug__ } from '../shared/debug'

export const createTokenRefreshScheduler = ({
  constants: { intervalMs, checkJitterPercent },
  callbacks: { onSchedulerTick },
}) => {
  let refreshTimer = null
  let stopped = true

  const getRandomDelay = (intervalMs, jitterPercent) => {
    const jitter = 1 + (Math.random() * 2 - 1) * jitterPercent
    return Math.floor(intervalMs * jitter)
  }

  const tick = async () => {
    const delay = getRandomDelay(intervalMs, checkJitterPercent)

    refreshTimer = setTimeout(async () => {
      try {
        await onSchedulerTick?.()
      } catch (error) {
        __timedDebug__('⚠ Шедулер перехватил ошибку', error)
        // nothing
      } finally {
        if (!stopped) {
          tick()
        }
      }
    }, delay)
  }

  const start = () => {
    __timedDebug__('⏵ Scheduler...')

    stop()
    stopped = false
    tick()
  }

  const stop = () => {
    stopped = true

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
