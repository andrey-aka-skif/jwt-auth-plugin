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
