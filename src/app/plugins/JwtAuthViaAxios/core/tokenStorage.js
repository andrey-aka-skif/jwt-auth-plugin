export const createTokenStorage = ({
  accessTokenStorageKey,
  refreshTokenStorageKey,
}) => {
  const saveTokenPair = async ({ accessToken, refreshToken }) => {
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
