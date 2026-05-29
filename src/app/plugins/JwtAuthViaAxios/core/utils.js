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

export function __timedDebug__(...args) {
  const stack = new Error().stack
  const frames = stack.split('\n')

  // Ищем caller (первый фрейм после debug)
  let callerFrame = ''
  for (let i = 2; i < frames.length; i++) {
    if (!frames[i].includes('debug')) {
      callerFrame = frames[i]
      break
    }
  }

  let context = ''

  // Пытаемся получить имя функции
  let match = callerFrame.match(/at\s+(\S+)\s+\(/)
  if (match && !match[1].includes('anonymous')) {
    // У нас есть имя функции
    context = match[1]
  } else {
    // Функция анонимная или стрелочная - показываем файл и строку
    match =
      callerFrame.match(/\((.+):(\d+):\d+\)/) ||
      callerFrame.match(/at\s+(.+):(\d+):\d+/)

    if (match) {
      let filePath = match[1]
      const fileName = filePath.split('/').pop().split('\\').pop().split('?')[0]
      const line = match[2]
      context = `${fileName}:${line}`
    } else {
      context = '?'
    }
  }

  // Время
  const now = new Date()
  const time =
    now.toLocaleTimeString('ru-RU', { hour12: false }) +
    '.' +
    String(now.getMilliseconds()).padStart(3, '0')

  console.log(`[${time}] [${context}]`, ...args)
}
