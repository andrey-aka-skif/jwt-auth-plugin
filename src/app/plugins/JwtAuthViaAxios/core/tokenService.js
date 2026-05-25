import { RefreshTokenError } from './RefreshTokenError'

export const createTokenService = ({
  tokenStorage,
  api,
  accessTokenResponseKey,
  refreshTokenResponseKey,
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

  const decodeJwt = token => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(window.atob(base64))
    } catch {
      return null
    }
  }

  const refreshTokens = async () => {
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

  const getAccessTokenRemainingLifetime = () => {}

  const isAccessTokenExpired = () => {}

  const shouldRefreshToken = thresholdMs => {
    return getAccessTokenRemainingLifetime() < thresholdMs
  }

  return {
    ...tokenStorage,
    refreshTokens,
  }
}
