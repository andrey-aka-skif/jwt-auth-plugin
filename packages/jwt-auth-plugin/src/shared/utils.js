import { STRINGS } from './strings'
import { REQUIRED } from './symbols'

const isObject = value => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const mergeConfigs = (target, source) => {
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

const validateConfig = (obj, path = '') => {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key

    if (value === REQUIRED) {
      throw new Error(
        formatMessage(
          `Не указано обязательное поле ${currentPath} в конфигурации`
        )
      )
    }

    if (isObject(value)) {
      validateConfig(value, currentPath)
    }
  }
}

export const resolveConfig = (baseConfig, userConfig) => {
  const config = mergeConfigs(baseConfig, userConfig)
  validateConfig(config)
  return config
}

export const formatMessage = message => {
  return `[${STRINGS.name}]: ${message}`
}

export const resolveStorageKeys = ({ storage }) => {
  const { namespace, accessTokenKey, refreshTokenKey } = storage
  const withNamespace = key => (namespace ? `${namespace}:${key}` : key)

  return {
    accessTokenStorageKey: withNamespace(accessTokenKey),
    refreshTokenStorageKey: withNamespace(refreshTokenKey),
  }
}

// Пропускаем только внутренние пути: строка, начинающаяся с одного '/'
// и не с '//'. Это отсекает абсолютные внешние URL (http://…, //evil.com),
// поэтому путь из query безопасно использовать как цель редиректа.
// Используется только внутри модуля (resolveSavedPath / appendBackToPreviousQuery).
const isSafeInternalPath = path => {
  return (
    typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
  )
}

// Разбор сохранённого исходного пути из query. Возвращает безопасный
// внутренний путь либо null, если фича выключена / путь отсутствует / небезопасен.
export const resolveSavedPath = (backToPrevious, query) => {
  if (!backToPrevious?.enabled) {
    return null
  }

  const saved = query?.[backToPrevious.queryKey]

  return isSafeInternalPath(saved) ? saved : null
}

// Дополняет цель редиректа на логин query-параметром с исходным путём.
// Если опция выключена или путь небезопасен — возвращает цель без изменений.
export const appendBackToPreviousQuery = (target, backToPrevious, fullPath) => {
  if (!backToPrevious?.enabled || !isSafeInternalPath(fullPath)) {
    return target
  }

  const location = typeof target === 'string' ? { path: target } : { ...target }

  return {
    ...location,
    query: { ...location.query, [backToPrevious.queryKey]: fullPath },
  }
}
