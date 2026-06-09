import { __timedDebug__ } from './debug'

export const createTokenService = ({
  tokenStorage,
  api,
  constants: { accessTokenExpirationThresholdMs },
  keys: {
    accessTokenResponseKey,
    refreshTokenResponseKey,
    lockKey,
    lockTimeout,
  },
  callbacks: { onRefreshFailure },
}) => {
  const decodeToken = token => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(atob(base64))
    } catch {
      return null
    }
  }

  const refreshTokens = async () => {
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

    return tokens
  }

  const tryRefreshTokensUnderLock = async () => {
    try {
      await refreshTokens()

      __timedDebug__('● Токены обновлены')
    } catch (error) {
      __timedDebug__('ОШИБКА при рефреше токена:', error)

      tokenStorage.clearTokens()
      onRefreshFailure?.()
      throw error
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

    return navigator.locks.request(
      lockKey,
      { signal: AbortSignal.timeout(lockTimeout) },
      async () => {
        if (shouldRefreshToken()) {
          await tryRefreshTokensUnderLock()
        }
      }
    )
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
