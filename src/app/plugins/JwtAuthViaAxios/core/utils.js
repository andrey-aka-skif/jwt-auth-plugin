const isObject = value => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export const mergeConfigs = (target, source) => {
  const output = { ...target }

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key]

    if (sourceValue === undefined) {
      continue
    }

    output[key] =
      isObject(targetValue) && isObject(sourceValue)
        ? mergeConfigs(targetValue, sourceValue)
        : sourceValue
  }

  return output
}

// удалить
const decodeJwt = token => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64))
  } catch {
    return null
  }
}

// удалить
export const getTokenRemainingLifetimeMs = token => {
  const decoded = decodeJwt(token)
  if (!decoded?.exp) {
    return null
  }
  return decoded.exp * 1000 - Date.now()
}
