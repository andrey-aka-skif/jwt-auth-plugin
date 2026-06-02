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

  window.addEventListener('storage', async event => {
    if (event.key === accessTokenStorageKey) {
      __timedDebug__()
      await handleTokenChange()
    }
  })
}
