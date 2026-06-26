import { traceLog } from '@andrey-aka-skif/debug-utils'

export const createRefreshScheduler = ({
  constants: { intervalMs, checkJitterPercent },
  callbacks: { onNext },
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
        await onNext?.()
      } catch (error) {
        traceLog('⚠ Шедулер перехватил ошибку', error)
        // nothing
      } finally {
        if (!stopped) {
          tick()
        }
      }
    }, delay)
  }

  const start = () => {
    traceLog('⏵ Scheduler...')

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
