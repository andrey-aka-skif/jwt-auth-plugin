import {
  _decodeToken,
  _getAccessTokenSub,
  _isAccessTokenExist,
  _isAccessTokenExpired,
  _isUserChanged,
  _isValidAccessToken,
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

      if (
        isAccessTokenExist &&
        _isUserChanged(oldSub, newAccessToken, subKey)
      ) {
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

  const saveTokenPair = ({ accessToken, refreshToken }) => {
    if (
      !_isValidAccessToken(accessToken) ||
      typeof refreshToken !== 'string' ||
      !refreshToken
    ) {
      throw new Error(formatMessage('Сервер вернул некорректные токены'))
    }

    tokenStorage.saveTokenPair({ accessToken, refreshToken })
  }

  const refreshTokens = async () => {
    const refreshToken = tokenStorage.getRefreshToken()

    if (!refreshToken) {
      throw new Error(formatMessage('Рефреш токен не найден'))
    }

    const { data } = await client.refresh(refreshToken)

    saveTokenPair({
      accessToken: data[accessTokenResponseKey],
      refreshToken: data[refreshTokenResponseKey],
    })
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

  const isAccessTokenExpired = () => {
    return _isAccessTokenExpired(tokenStorage.getAccessToken())
  }

  const getAccessTokenSub = () => {
    return _getAccessTokenSub(tokenStorage.getAccessToken(), subKey)
  }

  // Весь декодированный payload access-токена как есть (или null для битого
  // токена). Плагин не интерпретирует содержимое — см. session.userSource.
  const getAccessTokenClaims = () => {
    return _decodeToken(tokenStorage.getAccessToken())
  }

  const isUserChanged = oldSub => {
    return _isUserChanged(oldSub, tokenStorage.getAccessToken(), subKey)
  }

  return {
    ...tokenStorage,
    saveTokenPair,
    tryRefreshTokens,
    isAccessTokenExist,
    isAccessTokenExpired,
    getAccessTokenSub,
    getAccessTokenClaims,
    isUserChanged,
  }
}
