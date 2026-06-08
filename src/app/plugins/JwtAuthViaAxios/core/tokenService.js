import { RefreshTokenError } from '../errors/RefreshTokenError'
import { __timedDebug__ } from './debug'

export const createTokenService = ({
  tokenStorage,
  api,
  constants: { accessTokenExpirationThresholdMs },
  keys: { accessTokenResponseKey, refreshTokenResponseKey, lockKey },
  callbacks: { onRefreshFailure },
}) => {
  let isRefreshing = false
  let failedQueue = []

  const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })

    failedQueue = []
  }

  const decodeToken = token => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(atob(base64))
    } catch {
      return null
    }
  }

  const tryRefreshTokensUnderLock = async () => {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
    }

    isRefreshing = true

    __timedDebug__('↻ refresh токенов в сервисе токенов...')

    try {
      const refreshToken = tokenStorage.getRefreshToken()

      if (!refreshToken) {
        throw new Error('Рефреш токен не найден')
      }

      const { data } = await api.refresh(refreshToken)

      const tokens = {
        accessToken: data[accessTokenResponseKey],
        refreshToken: data[refreshTokenResponseKey],
      }

      tokenStorage.saveTokenPair(tokens)

      processQueue(null, tokens)

      __timedDebug__('● Токены обновлены')
    } catch (error) {
      __timedDebug__('ОШИБКА при рефреше токена:', error)

      tokenStorage.clearTokens()
      processQueue(error, null)
      onRefreshFailure?.()

      throw error
    } finally {
      isRefreshing = false
    }
  }

  const tryRefreshTokens = async () => {
    const locks = await navigator.locks.query()
    const isLocked = locks.held.some(lock => lock.name === lockKey)

    if (isLocked) {
      __timedDebug__(
        '__________БЛОКИРОВКА уже существует. Ждем завершения__________'
      )
    }

    return navigator.locks.request(lockKey, async () => {
      if (shouldRefreshToken()) {
        tryRefreshTokensUnderLock()
      }
    })
  }

  const getAccessTokenExpiration = () => {
    const token = tokenStorage.getAccessToken()

    if (!token) {
      return null
    }

    const decoded = decodeToken(token)

    return decoded?.exp ? decoded.exp * 1000 : null
  }

  const getAccessTokenRemainingLifetime = () => {
    const expiration = getAccessTokenExpiration()

    if (!expiration) {
      return 0
    }

    return expiration - Date.now()
  }

  const shouldRefreshToken = (
    thresholdMs = accessTokenExpirationThresholdMs
  ) => {
    if (!isAccessTokenExist()) {
      return false
    }

    return getAccessTokenRemainingLifetime() < thresholdMs
  }

  const isAccessTokenExist = () => {
    return !!tokenStorage.getAccessToken()
  }

  return {
    ...tokenStorage,
    tryRefreshTokens,
    shouldRefreshToken,
    isAccessTokenExist,
  }
}
