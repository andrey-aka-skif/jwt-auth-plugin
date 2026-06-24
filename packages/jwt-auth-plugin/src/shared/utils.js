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
