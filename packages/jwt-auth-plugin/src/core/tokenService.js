import { __tokensFingerprint__, __timedDebug__ } from '../shared/debug'
import { AuthenticationError } from '../errors/AuthenticationError'
import { NetworkError } from '../errors/NetworkError'
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
  api,
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
      __timedDebug__(`Ждем ${raceWaitIntervalMs} мс`)

      await _sleep(raceWaitIntervalMs)

      const newAccessToken = tokenStorage.getAccessToken()
      const isAccessTokenExist = _isAccessTokenExist(newAccessToken)

      // debug---
      __timedDebug__(
        `Перечитываем токен, попытка ${attempt}/${raceWaitMaxAttempts}`
      )
      __tokensFingerprint__(tokenStorage)
      __timedDebug__('isAccessTokenExist():', isAccessTokenExist)
      __timedDebug__(
        'isUserChanged():',
        _isUserChanged(oldSub, newAccessToken, subKey)
      )
      __timedDebug__(
        'shouldRefreshToken():',
        _shouldRefreshToken(newAccessToken, accessTokenExpirationThresholdMs)
      )
      // ---debug

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
        __timedDebug__('Есть новый токен. Кто-то обновил за нас. >>>>>>>>>>>>>')

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

      // Сетевой сбой: до сервера не достучались. Если включено сохранение сессии —
      // не трогаем токены, чтобы scheduler повторил рефреш позже, когда сеть вернётся.
      if (keepSessionOnNetworkError && error instanceof NetworkError) {
        __timedDebug__('🌐 Сетевая ошибка — сессия сохранена, повторим рефреш позже')

        throw error
      }

      __timedDebug__('Перечитать токен не удалось')

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
