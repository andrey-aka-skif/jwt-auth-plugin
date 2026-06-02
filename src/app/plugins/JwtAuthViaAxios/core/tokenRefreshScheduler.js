import { __timedDebug__ } from './debug'

export const createTokenRefreshScheduler = ({ tokenService, intervalMs }) => {
  let refreshTimer = null

  const tick = async () => {
    try {
      if (tokenService.shouldRefreshToken()) {
        __timedDebug__('tick планировщика рефреша')

        await tokenService.refreshTokens()
      }
    } catch {
      __timedDebug__('Шедулер перехватил ошибку')
      // nothing
    }
  }

  const start = () => {
    stop()

    __timedDebug__('Запущен планировщик рефреша токенов')

    refreshTimer = setInterval(tick, intervalMs)
  }

  const stop = () => {
    if (refreshTimer) {
      __timedDebug__('Остановлен планировщик рефреша токенов')
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  return {
    start,
    stop,
  }
}
