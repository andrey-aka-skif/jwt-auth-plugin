import { computed, readonly, ref } from 'vue'
import axios from 'axios'
import { DEFAULT_CONFIG } from './defaultConfig'
import { createDefaultApiAdapter } from './defaultApiAdapter'
import { getTokenRemainingLifetimeMs, mergeConfigs } from './utils'
import { createAxiosInstance } from './axiosInstance'
import { setupRoutingGuards } from './setupRoutingGuards'
import { setupCrossTabSync } from './setupCrossTabSync'
import { createTokenService } from './tokenService'
import { createSessionManager } from './sessionManager'
import { createRedirectRules } from './redirectRules'
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
  let redirectRules = null
  // Как сообщить об ошибке?

  tokenStorage = createTokenStorage({
    keys: {
      accessTokenStorageKey: config.token.access.storageKey,
      refreshTokenStorageKey: config.token.refresh.storageKey,
    },
  })

  tokenService = createTokenService({
    tokenStorage,
    api,
    onRefreshFailure: () => {
      __timedDebug__('createTokenService. onRefreshFailure')

      sessionManager.clear()
      redirectRules.tryRedirect()
    },
    accessTokenExpirationThresholdMs:
      config.token.refresh.checkIntervalThresholdMinutes * 60 * 1000,
    keys: {
      accessTokenResponseKey: config.token.access.responseKey,
      refreshTokenResponseKey: config.token.refresh.responseKey,
      lockKey: config.token.refresh.lockKey,
    },
  })

  sessionManager = createSessionManager({
    api,
    tokenService,
    onRestoreSession: () => {
      __timedDebug__('createSessionManager. onRestoreSession')

      tokenRefreshScheduler?.start()
      redirectRules?.tryRedirect()
    },
    onClearSession: () => {
      __timedDebug__('createSessionManager. onClearSession')

      tokenRefreshScheduler?.stop()
      redirectRules.tryRedirect()
    },
    keys: {
      accessTokenResponseKey: config.token.access.responseKey,
      refreshTokenResponseKey: config.token.refresh.responseKey,
    },
  })

  redirectRules = createRedirectRules({
    sessionManager,
    router,
    redirect: config.redirect,
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
    redirect: config.redirect,
  })

  setupCrossTabSync({
    tokenService,
    sessionManager,
    keys: {
      accessTokenStorageKey: config.token.access.storageKey,
    },
  })

  if (config.plugin.autoRefresh) {
    tokenRefreshScheduler = createTokenRefreshScheduler({
      tokenService,
      intervalMs: config.token.refresh.checkIntervalMinutes * 60 * 1000,
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
