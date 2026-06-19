import { __tokensFingerprint__, __timedDebug__ } from './debug'
import { AuthenticationError } from '../errors/AuthenticationError'
import {
  _getAccessTokenSub,
  _isAccessTokenExist,
  _isUserChanged,
  _shouldRefreshToken,
  _sleep,
} from './tokenUtils'

export const createTokenService = ({
  tokenStorage,
  api,
  constants: {
    accessTokenExpirationThresholdMs,
    lockTimeout,
    raceWaitIntervalMs,
  },
  keys: { accessTokenResponseKey, refreshTokenResponseKey, lockKey, subKey },
  callbacks: { onRefreshFailure, onChangeUser },
}) => {
  const tryReadTokensAgain = async oldSub => {
    __timedDebug__(`Ждем ${raceWaitIntervalMs} мс.`)

    await _sleep(raceWaitIntervalMs)
    const newAccessToken = tokenStorage.getAccessToken()

    // debug---
    __timedDebug__('isAccessTokenExist():', _isAccessTokenExist(newAccessToken))
    __timedDebug__(
      'isUserChanged():',
      _isUserChanged(oldSub, newAccessToken, subKey)
    )
    __timedDebug__(
      'shouldRefreshToken():',
      _shouldRefreshToken(newAccessToken, accessTokenExpirationThresholdMs)
    )
    __tokensFingerprint__(tokenStorage)
    // ---debug

    const isAccessTokenExist = _isAccessTokenExist(newAccessToken)

    if (isAccessTokenExist && _isUserChanged(oldSub, newAccessToken, subKey)) {
      onChangeUser?.()
      return true
    }

    if (
      isAccessTokenExist &&
      !_shouldRefreshToken(newAccessToken, accessTokenExpirationThresholdMs)
    ) {
      __timedDebug__('Есть новый токен. Кто-то обновил за нас. >>>>>>>>>>>>>')

      return true
    }

    return false
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
    __tokensFingerprint__(tokenStorage)
  }

  const tryRefreshTokensUnderLock = async accessToken => {
    const oldSub = _getAccessTokenSub(accessToken, subKey)

    try {
      await refreshTokens()

      __timedDebug__('● Токены обновлены')
    } catch (error) {
      __timedDebug__('ОШИБКА при рефреше токена:', error)

      if (
        error instanceof AuthenticationError &&
        (await tryReadTokensAgain(oldSub))
      ) {
        return
      }

      __timedDebug__('Перечитать токен не удалось')

      tokenStorage.clearTokens()
      onRefreshFailure?.()
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
