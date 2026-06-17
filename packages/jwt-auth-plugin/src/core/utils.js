export const REQUIRED = Symbol('required')

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

export const validateConfig = (obj, path = '') => {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key

    if (value === REQUIRED) {
      throw new Error(
        `Требуется указать обязательное поле ${currentPath} в конфигурации`
      )
    }

    if (isObject(value)) {
      validateConfig(value, currentPath)
    }
  }
}
