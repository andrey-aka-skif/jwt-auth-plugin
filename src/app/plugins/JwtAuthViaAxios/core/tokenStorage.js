import { __timedDebug__ } from './debug'

export const createTokenStorage = ({
  keys: { accessTokenStorageKey, refreshTokenStorageKey },
}) => {
  const saveTokenPair = ({ accessToken, refreshToken }) => {
    __timedDebug__('SAVE RT', refreshToken.slice(0, 8))

    localStorage.setItem(accessTokenStorageKey, accessToken)
    localStorage.setItem(refreshTokenStorageKey, refreshToken)
  }

  const getAccessToken = () => {
    return localStorage.getItem(accessTokenStorageKey)
  }

  const getRefreshToken = () => {
    return localStorage.getItem(refreshTokenStorageKey)
  }

  const clearTokens = () => {
    localStorage.removeItem(accessTokenStorageKey)
    localStorage.removeItem(refreshTokenStorageKey)
  }

  return {
    saveTokenPair,
    getAccessToken,
    getRefreshToken,
    clearTokens,
  }
}
