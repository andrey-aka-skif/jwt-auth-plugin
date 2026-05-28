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
      await handleTokenChange()
    }
  })
}
