import { storageFingerprint, traceLog } from '@andrey-aka-skif/debug-utils'
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
  keys: {
    accessTokenResponseKey,
    refreshTokenResponseKey,
    lockKey,
    subKey,
    accessTokenStorageKey,
    refreshTokenStorageKey,
  },
  callbacks: { onRefreshFailure, onChangeUser },
}) => {
  const tryReadTokensAgain = async oldSub => {
    for (let attempt = 1; attempt <= raceWaitMaxAttempts; attempt++) {
      traceLog(`Ждем ${raceWaitIntervalMs} мс`)

      await _sleep(raceWaitIntervalMs)

      const newAccessToken = tokenStorage.getAccessToken()
      const isAccessTokenExist = _isAccessTokenExist(newAccessToken)

      // debug---
      traceLog(
        `Перечитываем токен, попытка ${attempt}/${raceWaitMaxAttempts}`
      )
      traceLog(
        storageFingerprint([
          { key: accessTokenStorageKey, label: 'at' },
          { key: refreshTokenStorageKey, label: 'rt' },
        ])
      )
      traceLog('isAccessTokenExist():', isAccessTokenExist)
      traceLog(
        'isUserChanged():',
        _isUserChanged(oldSub, newAccessToken, subKey)
      )
      traceLog(
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
        traceLog('Есть новый токен. Кто-то обновил за нас. >>>>>>>>>>>>>')

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
    traceLog(
        storageFingerprint([
          { key: accessTokenStorageKey, label: 'at' },
          { key: refreshTokenStorageKey, label: 'rt' },
        ])
      )
  }

  const tryRefreshTokensUnderLock = async accessToken => {
    const oldSub = _getAccessTokenSub(accessToken, subKey)

    try {
      await refreshTokens()

      traceLog('● Токены обновлены')
    } catch (error) {
      traceLog('ОШИБКА при рефреше токена:', error)

      const kind = client.getErrorKind(error)

      if (kind === 'auth' && (await tryReadTokensAgain(oldSub))) {
        return
      }

      // Сетевой сбой: до сервера не достучались. Если включено сохранение сессии —
      // не трогаем токены, чтобы scheduler повторил рефреш позже, когда сеть вернётся.
      if (kind === 'network' && keepSessionOnNetworkError) {
        traceLog('🌐 Сетевая ошибка — сессия сохранена, повторим рефреш позже')

        throw error
      }

      traceLog('Перечитать токен не удалось')

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
