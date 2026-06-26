export const setupCrossTabSync = ({
  keys: { accessTokenStorageKey },
  callbacks: { onTokenChange },
}) => {
  const listener = event => {
    if (event.key === accessTokenStorageKey) {
      onTokenChange?.()
    }
  }

  window.addEventListener('storage', listener)

  const unsubscribe = () => {
    window.removeEventListener('storage', listener)
  }

  return unsubscribe
}
