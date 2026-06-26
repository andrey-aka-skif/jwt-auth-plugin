import { __timedDebug__ } from '@andrey-aka-skif/debug-utils'

export const setupCrossTabSync = ({
  keys: { accessTokenStorageKey },
  callbacks: { onTokenChange },
}) => {
  const listener = async event => {
    if (event.key === accessTokenStorageKey) {
      __timedDebug__('⇄ localStorage storage event')

      onTokenChange?.()
    }
  }

  window.addEventListener('storage', listener)

  const unsubscribe = () => {
    window.removeEventListener('storage', listener)
  }

  return unsubscribe
}
