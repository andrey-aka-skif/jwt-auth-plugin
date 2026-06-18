import { __timedDebug__ } from './debug'
import {
  _getAccessTokenSub,
  _isAccessTokenExist,
  _isUserChanged as _isUserChanged,
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
  }

  const tryRefreshTokensUnderLock = async accessToken => {
    const oldSub = _getAccessTokenSub(accessToken, subKey)

    try {
      await refreshTokens()
      __timedDebug__('● Токены обновлены')
    } catch (error) {
      __timedDebug__('ОШИБКА при рефреше токена:', error)
      __timedDebug__(`Ждем ${raceWaitIntervalMs} мс.`)

      await _sleep(raceWaitIntervalMs)

      __timedDebug__('isAccessTokenExist():', isAccessTokenExist())
      __timedDebug__('isUserChanged():', isUserChanged(getAccessTokenSub()))
      __timedDebug__('shouldRefreshToken():', _shouldRefreshToken())
      __timedDebug__('fingerprint:', tokenStorage.getDebugTokensFingerprint())

      const newAccessToken = tokenStorage.getAccessToken()

      const isAccessTokenExist = _isAccessTokenExist(newAccessToken)

      if (isAccessTokenExist && _isUserChanged(oldSub, newAccessToken)) {
        onChangeUser?.()
        return
      }

      if (
        isAccessTokenExist &&
        !_shouldRefreshToken(accessToken, accessTokenExpirationThresholdMs)
      ) {
        __timedDebug__('Есть новый токен. Кто-то обновил за нас. >>>>>>>>>>>>>')

        return
      }

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
    return _isUserChanged(oldSub, tokenStorage.getAccessToken())
  }

  return {
    ...tokenStorage,
    tryRefreshTokens,
    isAccessTokenExist,
    getAccessTokenSub,
    isUserChanged,
  }
}
