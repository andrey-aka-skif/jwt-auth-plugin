import { __timedDebug__ } from './debug'

export const createTokenStorage = ({
  keys: { accessTokenStorageKey, refreshTokenStorageKey },
}) => {
  let generation = 0

  const saveTokenPair = ({ accessToken, refreshToken }) => {
    localStorage.setItem(accessTokenStorageKey, accessToken)
    localStorage.setItem(refreshTokenStorageKey, refreshToken)

    localStorage.setItem('debug_token_generation', generation++) // тут косяк, но не суть

    __timedDebug__('SAVE TOKENS', getDebugTokensFingerprint())
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

  const getDebugTokensFingerprint = () => ({
    at: getAccessToken()?.slice(0, 8),
    rt: getRefreshToken()?.slice(0, 8),
    gen: localStorage.getItem('debug_token_generation'),
  })

  return {
    saveTokenPair,
    getAccessToken,
    getRefreshToken,
    clearTokens,
    getDebugTokensFingerprint,
  }
}
