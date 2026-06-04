import { __timedDebug__ } from './debug'

export const setupCrossTabSync = ({
  tokenService,
  sessionManager,
  keys: { accessTokenStorageKey },
}) => {
  const handleTokenChange = async () => {
    const accessToken = tokenService.getAccessToken()

    if (accessToken) {
      await sessionManager.restoreSession()
    } else {
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
