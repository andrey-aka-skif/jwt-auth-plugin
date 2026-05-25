export const setupCrossTabSync = ({
  tokenService,
  sessionManager,
  keys: { accessTokenKey, refreshTokenKey },
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
    if (event.key === accessTokenKey || event.key === refreshTokenKey) {
      await handleTokenChange()
    }
  })
}
