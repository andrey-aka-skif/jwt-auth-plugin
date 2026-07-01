export const _decodeToken = token => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const jsonPayload = new TextDecoder().decode(bytes)
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export const _isAccessTokenExist = accessToken => !!accessToken

export const _isValidAccessToken = accessToken =>
  typeof accessToken === 'string' &&
  accessToken.split('.').length === 3 &&
  _decodeToken(accessToken) !== null

export const _getAccessTokenSub = (accessToken, subKey) => {
  const decoded = _decodeToken(accessToken)
  return decoded?.[subKey] ?? null
}

const _getAccessTokenExpiration = accessToken => {
  const decoded = _decodeToken(accessToken)
  return decoded?.exp ? decoded.exp * 1000 : null
}

const _getAccessTokenRemainingLifetime = accessToken => {
  if (!accessToken) {
    return 0
  }

  const expiration = _getAccessTokenExpiration(accessToken)

  if (!expiration) {
    return 0
  }

  return expiration - Date.now()
}

export const _shouldRefreshToken = (accessToken, thresholdMs) => {
  if (!_isAccessTokenExist(accessToken)) {
    return false
  }

  const remaining = _getAccessTokenRemainingLifetime(accessToken)

  return remaining < thresholdMs
}

export const _isUserChanged = (oldSub, accessToken, subKey) =>
  oldSub !== _getAccessTokenSub(accessToken, subKey)

export const _sleep = async ms =>
  new Promise(resolve => setTimeout(resolve, ms))
