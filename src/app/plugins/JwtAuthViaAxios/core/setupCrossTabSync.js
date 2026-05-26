export const setupCrossTabSync = ({
  tokenService,
  sessionManager,
  keys: { accessTokenStorageKey, refreshTokenStorageKey },
}) => {
  const handleTokenChange = async () => {
    const accessToken = tokenService.getAccessToken()

    if (accessToken && !sessionManager.isAuthenticated.value) {
      await sessionManager.restoreSession()
    } else {
      await sessionManager.clear()
    }
  }

  window.addEventListener('storage', async event => {
    if (
      event.key === accessTokenStorageKey ||
      event.key === refreshTokenStorageKey
    ) {
      await handleTokenChange()
    }
  })
}
