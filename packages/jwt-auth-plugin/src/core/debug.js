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

export function __tokensFingerprint__(tokensStorage) {
  const fingerprint = {
    at: `${tokensStorage.getAccessToken()?.slice(0, 8)}...`,
    rt: `${tokensStorage.getRefreshToken()?.slice(0, 8)}...`,
  }

  __timedDebug__(fingerprint)
}
