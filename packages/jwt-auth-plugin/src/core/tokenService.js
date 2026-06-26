import {
  _getAccessTokenSub,
  _isAccessTokenExist,
  _isUserChanged,
  _shouldRefreshToken,
  _sleep,
} from './tokenUtils'
import { formatMessage } from '../shared/utils'

export const createTokenService = ({
  tokenStorage,
  client,
  constants: {
    accessTokenExpirationThresholdMs,
    lockTimeout,
    raceWaitIntervalMs,
    raceWaitMaxAttempts,
    keepSessionOnNetworkError,
  },
  keys: { accessTokenResponseKey, refreshTokenResponseKey, lockKey, subKey },
  callbacks: { onRefreshFailure, onChangeUser },
}) => {
  const tryReadTokensAgain = async oldSub => {
    for (let attempt = 1; attempt <= raceWaitMaxAttempts; attempt++) {
      await _sleep(raceWaitIntervalMs)

      const newAccessToken = tokenStorage.getAccessToken()
      const isAccessTokenExist = _isAccessTokenExist(newAccessToken)

      if (isAccessTokenExist && _isUserChanged(oldSub, newAccessToken, subKey)) {
        onChangeUser?.()
        return true
      }

      if (
        isAccessTokenExist &&
        !_shouldRefreshToken(newAccessToken, accessTokenExpirationThresholdMs)
      ) {
        return true
      }
    }

    return false
  }

  const refreshTokens = async () => {
    const refreshToken = tokenStorage.getRefreshToken()

    if (!refreshToken) {
      throw new Error(formatMessage('Рефреш токен не найден'))
    }

    const { data } = await client.refresh(refreshToken)

    const tokens = {
      accessToken: data[accessTokenResponseKey],
      refreshToken: data[refreshTokenResponseKey],
    }

    tokenStorage.saveTokenPair(tokens)
  }

  const tryRefreshTokensUnderLock = async accessToken => {
    const oldSub = _getAccessTokenSub(accessToken, subKey)

    try {
      await refreshTokens()
    } catch (error) {
      const kind = client.getErrorKind(error)

      if (kind === 'auth' && (await tryReadTokensAgain(oldSub))) {
        return
      }

      // Сетевой сбой: до сервера не достучались. Если включено сохранение сессии —
      // не трогаем токены, чтобы scheduler повторил рефреш позже, когда сеть вернётся.
      if (kind === 'network' && keepSessionOnNetworkError) {
        throw error
      }

      tokenStorage.clearTokens()
      onRefreshFailure?.(error)
      throw error
    }
  }

  const tryRefreshTokens = async () => {
    return navigator.locks.request(
      lockKey,
      { signal: AbortSignal.timeout(lockTimeout) },
      async () => {
        const accessToken = tokenStorage.getAccessToken()

        if (
          _shouldRefreshToken(accessToken, accessTokenExpirationThresholdMs)
        ) {
          await tryRefreshTokensUnderLock(accessToken)
        }
      }
    )
  }

  const isAccessTokenExist = () => {
    return _isAccessTokenExist(tokenStorage.getAccessToken())
  }

  const getAccessTokenSub = () => {
    return _getAccessTokenSub(tokenStorage.getAccessToken(), subKey)
  }

  const isUserChanged = oldSub => {
    return _isUserChanged(oldSub, tokenStorage.getAccessToken(), subKey)
  }

  return {
    ...tokenStorage,
    tryRefreshTokens,
    isAccessTokenExist,
    getAccessTokenSub,
    isUserChanged,
  }
}
