import { __timedDebug__ } from './debug'

export const createTokenService = ({
  tokenStorage,
  api,
  constants: { accessTokenExpirationThresholdMs, lockTimeout },
  keys: { accessTokenResponseKey, refreshTokenResponseKey, lockKey, subKey },
  callbacks: { onRefreshFailure },
}) => {
  const decodeToken = token => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const jsonPayload = new TextDecoder().decode(bytes)
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  let refreshCounter = 0

  const refreshTokens = async refreshId => {
    const refreshToken = tokenStorage.getRefreshToken()

    __timedDebug__(
      `REFRESH ${refreshId} USING RT`,
      tokenStorage.getDebugTokensFingerprint()
    )

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
    const refreshId = ++refreshCounter

    __timedDebug__(`REFRESH ${refreshId} START`)

    try {
      await refreshTokens(refreshId)

      __timedDebug__(`REFRESH ${refreshId} SUCCESS`)
      __timedDebug__('● Токены обновлены')
    } catch (error) {
      __timedDebug__(`REFRESH ${refreshId} FAILED`)
      __timedDebug__('ОШИБКА при рефреше токена:', error)

      tokenStorage.clearTokens()
      onRefreshFailure?.()
      throw error
    }
  }

  const tryRefreshTokens = async origin => {
    __timedDebug__('TRY REFRESH FROM', origin)

    const locks = await navigator.locks.query()
    const isLocked = locks.held.some(lock => lock.name === lockKey)

    if (isLocked) {
      __timedDebug__(
        '__________БЛОКИРОВКА уже существует. Ждем завершения__________'
      )

      return
    }

    return navigator.locks.request(
      lockKey,
      { signal: AbortSignal.timeout(lockTimeout) },
      async () => {
        __timedDebug__(
          'LOCK ACQUIRED',
          tokenStorage.getDebugTokensFingerprint()
        )

        const shouldRefresh = shouldRefreshToken()

        __timedDebug__(
          'LOCK SHOULD_REFRESH',
          tokenStorage.getDebugTokensFingerprint(),
          'shouldRefresh:',
          shouldRefresh
        )

        if (shouldRefreshToken()) {
          await tryRefreshTokensUnderLock()
        }
      }
    )
  }

  const getAccessTokenSub = () => {
    const token = tokenStorage.getAccessToken()

    if (!token) {
      return null
    }

    const decoded = decodeToken(token)

    return decoded?.[subKey] ?? null
  }

  const isUserChanged = oldSub => oldSub !== getAccessTokenSub()

  const getAccessTokenExpiration = () => {
    const token = tokenStorage.getAccessToken()

    if (!token) {
      return null
    }

    const decoded = decodeToken(token)

    // console.log(decoded)

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
    const token = tokenStorage.getAccessToken()
    const remaining = getAccessTokenRemainingLifetime()

    __timedDebug__(
      'SHOULD_REFRESH',
      tokenStorage.getDebugTokensFingerprint(),
      remaining,
      thresholdMs
    )

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
    getAccessTokenSub,
    isUserChanged,
  }
}
