import { __timedDebug__ } from './debug'

export const setupCrossTabSync = ({
  tokenService,
  sessionManager,
  keys: { accessTokenStorageKey },
}) => {
  const handleTokenChange = async () => {
    if (tokenService.isAccessTokenExist()) {
      await sessionManager.restoreSession()
    } else {
      __timedDebug__('Токена больше нет!')

      await sessionManager.clear()
    }
  }

  const listener = async event => {
    if (event.key === accessTokenStorageKey) {
      __timedDebug__('Синхронизация вкладок.........')

      await handleTokenChange()
    }
  }

  window.addEventListener('storage', listener)

  const unsubscribe = () => {
    window.removeEventListener('storage', listener)
  }

  return unsubscribe
}
