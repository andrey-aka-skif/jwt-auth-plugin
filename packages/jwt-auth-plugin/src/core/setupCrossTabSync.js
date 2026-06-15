import { __timedDebug__ } from './debug'

export const setupCrossTabSync = ({
  keys: { accessTokenStorageKey },
  callbacks: { onTokenChange },
}) => {
  const listener = async event => {
    if (event.key === accessTokenStorageKey) {
      __timedDebug__('⇄ Синхронизация вкладок.........')

      onTokenChange?.()
    }
  }

  window.addEventListener('storage', listener)

  const unsubscribe = () => {
    window.removeEventListener('storage', listener)
  }

  return unsubscribe
}
