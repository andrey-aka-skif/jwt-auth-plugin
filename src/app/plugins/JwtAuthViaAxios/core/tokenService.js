import { RefreshTokenError } from './RefreshTokenError'
import { __timedDebug__ } from './utils'

export const createTokenService = ({
  tokenStorage,
  api,
  accessTokenExpirationThresholdMs,
  keys: { accessTokenResponseKey, refreshTokenResponseKey },
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
      return JSON.parse(window.atob(base64))
    } catch {
      return null
    }
  }

  const refreshTokens = async () => {
    __timedDebug__()

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
    }

    isRefreshing = true

    try {
      const refreshToken = tokenStorage.getRefreshToken()

      if (!refreshToken) {
        throw new RefreshTokenError('Рефреш токен не найден')
      }

      const { data } = await api.refresh(refreshToken)

      const tokens = {
        accessToken: data[accessTokenResponseKey],
        refreshToken: data[refreshTokenResponseKey],
      }

      tokenStorage.saveTokenPair(tokens)

      processQueue(null, tokens)

      return tokens
    } catch (error) {
      tokenStorage.clearTokens()

      const refreshError =
        error instanceof RefreshTokenError ? error : new RefreshTokenError()

      processQueue(refreshError, null)

      throw refreshError
    } finally {
      isRefreshing = false
    }
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
    return getAccessTokenRemainingLifetime() < thresholdMs
  }

  const isAccessTokenExist = () => {
    return !!tokenStorage.getAccessToken()
  }

  return {
    ...tokenStorage,
    refreshTokens,
    shouldRefreshToken,
    isAccessTokenExist,
  }
}
