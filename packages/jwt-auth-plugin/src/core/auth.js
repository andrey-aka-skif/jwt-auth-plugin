import { readonly } from 'vue'
import { DEFAULT_CONFIG } from './defaultConfig'
import { createDefaultApiAdapter } from './defaultApiAdapter'
import { mergeConfigs } from './utils'
import { setupRoutingGuards } from './setupRoutingGuards'
import { setupCrossTabSync } from './setupCrossTabSync'
import { createTokenService } from './tokenService'
import { createSessionManager } from './sessionManager'
import { maybeAuthRedirect } from './maybeAuthRedirect'
import { createTokenStorage } from './tokenStorage'
import { setupInterceptors } from './setupInterceptors'
import { createTokenRefreshScheduler } from './tokenRefreshScheduler'
import { __timedDebug__ } from './debug'

export const createJwtAuthViaAxios = ({
  router,
  axiosInstance,
  api = undefined,
  config = DEFAULT_CONFIG,
}) => {
  config = mergeConfigs(DEFAULT_CONFIG, config)

  if (!api) {
    api = createDefaultApiAdapter({ axiosInstance, config })
  }

  let tokenStorage = null
  let tokenRefreshScheduler = null
  let tokenService = null
  let sessionManager = null
  // Как сообщить об ошибке?

  const maybeAuthRedirectViaAdapter = () =>
    maybeAuthRedirect({
      sessionManager,
      router,
      redirectPathes: config.redirect,
    })

  tokenStorage = createTokenStorage({
    keys: {
      accessTokenStorageKey: config.token.access.storageKey,
      refreshTokenStorageKey: config.token.refresh.storageKey,
    },
  })

  tokenService = createTokenService({
    tokenStorage,
    api,
    constants: {
      accessTokenExpirationThresholdMs:
        config.token.refresh.checkIntervalThresholdMinutes * 60 * 1000,
      lockTimeout: config.token.refresh.lockTimeout,
    },
    keys: {
      accessTokenResponseKey: config.token.access.responseKey,
      refreshTokenResponseKey: config.token.refresh.responseKey,
      lockKey: config.token.refresh.lockKey,
    },
    callbacks: {
      onRefreshFailure: () => {
        __timedDebug__('💀 Рефреш токена не удался. Очищаем сессию')

        sessionManager.clear()
        maybeAuthRedirectViaAdapter()
      },
    },
  })

  sessionManager = createSessionManager({
    api,
    tokenService,
    keys: {
      accessTokenResponseKey: config.token.access.responseKey,
      refreshTokenResponseKey: config.token.refresh.responseKey,
    },
    callbacks: {
      onRestoreSession: () => {
        __timedDebug__('✓ Сессия восстановлена')

        tokenRefreshScheduler?.start()
        maybeAuthRedirectViaAdapter()
      },
      onClearSession: () => {
        __timedDebug__('○ Сессия очищена')

        tokenRefreshScheduler?.stop()
        maybeAuthRedirectViaAdapter()
      },
    },
  })

  setupInterceptors({
    axiosInstance,
    tokenService,
    keys: {
      accessTokenRequestKey: config.token.access.requestKey,
    },
  })

  setupRoutingGuards({
    router,
    sessionManager,
    redirectPathes: config.redirect,
  })

  setupCrossTabSync({
    keys: {
      accessTokenStorageKey: config.token.access.storageKey,
    },
    callbacks: {
      onTokenChange: () =>
        sessionManager.tryRestoreSession('auth.setupCrossTabSync'),
    },
  })

  if (config.plugin.autoRefresh) {
    tokenRefreshScheduler = createTokenRefreshScheduler({
      tokenService,
      constants: {
        intervalMs: config.token.refresh.checkIntervalMinutes * 60 * 1000,
      },
    })
  }

  const auth = {
    login: sessionManager.login,
    logout: sessionManager.logout,
    user: readonly(sessionManager.user),
    isReady: readonly(sessionManager.isReady),
    isAuthenticated: readonly(sessionManager.isAuthenticated),
  }

  if (config.plugin.autoStart) {
    sessionManager.initialize().catch(error => {
      console.error('Ошибка при инициализации аутентификации', error.message)
    })
  }

  return auth
}
