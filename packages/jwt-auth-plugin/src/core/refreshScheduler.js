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
      } catch {
        // проглатываем: следующий тик попробует снова
      } finally {
        if (!stopped) {
          tick()
        }
      }
    }, delay)
  }

  const start = () => {
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
