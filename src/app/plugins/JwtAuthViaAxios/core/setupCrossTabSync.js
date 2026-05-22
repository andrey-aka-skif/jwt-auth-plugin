export const setupCrossTabSync = ({
  state,
  tokens,
  sessions,
  accessTokenKey,
  refreshTokenKey,
  startProactiveTokenRefreshHandler,
}) => {
  const syncAuthState = async () => {
    // Токена нет. Если залогинены, то нужно разлогиниться
    if (!tokens.isAccessTokenExists()) {
      if (state.isAuthenticated.value) {
        await state.logout()
      }
      return
    }

    // Токен есть. Если аутентифицированы, то обновляем таймер
    if (state.isAuthenticated.value) {
      startProactiveTokenRefreshHandler?.()
      return
    }

    // Токен есть. Обновляем сессию. Если не аутентифицированы, то пробуем аутентифицироваться
    await sessions.refresh()

    if (state.isAuthenticated.value) {
      startProactiveTokenRefreshHandler?.()
    }
  }

  window.addEventListener('storage', async event => {
    if (event.key === accessTokenKey || event.key === refreshTokenKey) {
      await syncAuthState()
    }
  })
}
