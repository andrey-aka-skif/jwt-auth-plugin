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

  return {
    ...tokenStorage,
    refreshTokens,
  }
}
