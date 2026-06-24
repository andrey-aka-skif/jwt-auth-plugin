export const createTokenStorage = ({
  keys: {
    accessTokenStorageKey,
    refreshTokenStorageKey,
    namespace = undefined,
  },
}) => {
  let at = accessTokenStorageKey
  let rt = refreshTokenStorageKey

  if (namespace) {
    at = `${namespace}:${accessTokenStorageKey}`
    rt = `${namespace}:${refreshTokenStorageKey}`
  }

  const saveTokenPair = ({ accessToken, refreshToken }) => {
    localStorage.setItem(at, accessToken)
    localStorage.setItem(rt, refreshToken)
  }

  const getAccessToken = () => {
    return localStorage.getItem(at)
  }

  const getRefreshToken = () => {
    return localStorage.getItem(rt)
  }

  const clearTokens = () => {
    localStorage.removeItem(at)
    localStorage.removeItem(rt)
  }

  return {
    saveTokenPair,
    getAccessToken,
    getRefreshToken,
    clearTokens,
  }
}
