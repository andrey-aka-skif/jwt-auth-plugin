import { readonly, ref } from 'vue'
import { DEFAULT_CONFIG } from './defaultConfig'
import { createAxiosAdapter } from '../adapters/axiosAdapter'
import {
  formatMessage,
  resolveConfig,
  resolveStorageKeys,
} from '../shared/utils'
import { setupRoutingGuards } from './setupRoutingGuards'
import { setupCrossTabSync } from './setupCrossTabSync'
import { createTokenService } from './tokenService'
import { createSessionManager } from './sessionManager'
import { maybeAuthRedirect } from './maybeAuthRedirect'
import { createTokenStorage } from './tokenStorage'
import { setupInterceptors } from './setupInterceptors'
import { createRefreshScheduler } from './refreshScheduler'
import { __timedDebug__ } from '../shared/debug'

export const createJwtAuthViaAxios = ({
  router,
  axiosInstance,
  api = undefined,
  config = DEFAULT_CONFIG,
}) => {
  if (!router) {
    throw new Error(formatMessage('Требуется экземпляр router'))
  }

  if (!axiosInstance) {
    throw new Error(formatMessage('Требуется экземпляр axios'))
  }

  config = resolveConfig(DEFAULT_CONFIG, config)

  // Без api строим встроенный axios-адаптер поверх переданного инстанса.
  if (!api) {
    api = createAxiosAdapter({ axiosInstance, config })
  }

  let tokenStorage = null
  let scheduler = null
  let tokenService = null
  let sessionManager = null

  const lastError = ref(null)

  const maybeAuthRedirectViaAdapter = () =>
    maybeAuthRedirect({
      sessionManager,
      router,
      redirectPathes: config.redirect,
    })

  const { accessTokenStorageKey, refreshTokenStorageKey } =
    resolveStorageKeys(config)

  tokenStorage = createTokenStorage({
    keys: { accessTokenStorageKey, refreshTokenStorageKey },
  })

  tokenService = createTokenService({
    tokenStorage,
    api,
    constants: {
      accessTokenExpirationThresholdMs:
        config.token.refresh.checkIntervalThresholdMinutes * 60 * 1000,
      lockTimeout: config.token.refresh.lockTimeout,
      raceWaitIntervalMs: config.token.refresh.raceWaitIntervalMs,
      raceWaitMaxAttempts: config.token.refresh.raceWaitMaxAttempts,
      keepSessionOnNetworkError: config.session.keepSessionOnNetworkError,
    },
    keys: {
      accessTokenResponseKey: config.token.access.responseKey,
      refreshTokenResponseKey: config.token.refresh.responseKey,
      lockKey: config.token.refresh.lockKey,
      subKey: config.token.access.subKey,
    },
    callbacks: {
      onRefreshFailure: error => {
        __timedDebug__('💀 Рефреш токена не удался. Очищаем сессию')

        lastError.value = error
        sessionManager.clear()
        maybeAuthRedirectViaAdapter()
      },
      onChangeUser: () => {
        __timedDebug__('Сменился пользователь')

        sessionManager.tryRestoreSession('tokenService.onChangeUser')
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

        scheduler?.start()
        maybeAuthRedirectViaAdapter()
      },
      onClearSession: () => {
        __timedDebug__('○ Сессия очищена')

        scheduler?.stop()
        maybeAuthRedirectViaAdapter()
      },
    },
  })

  setupInterceptors({
    axiosInstance,
    tokenService,
    getErrorKind: api.getErrorKind,
    keys: {
      accessTokenRequestKey: config.token.access.requestKey,
    },
  })

  setupRoutingGuards({
    router,
    sessionManager,
    redirects: config.redirect,
  })

  setupCrossTabSync({
    keys: {
      accessTokenStorageKey,
    },
    callbacks: {
      onTokenChange: () =>
        sessionManager.tryRestoreSession('auth.setupCrossTabSync'),
    },
  })

  if (config.plugin.autoRefresh) {
    scheduler = createRefreshScheduler({
      constants: {
        intervalMs: config.token.refresh.checkIntervalMinutes * 60 * 1000,
        checkJitterPercent: config.token.refresh.checkJitterPercent,
      },
      callbacks: {
        onNext: async () => {
          __timedDebug__('⏱')

          await tokenService.tryRefreshTokens('scheduler')
        },
      },
    })
  }

  const auth = {
    login: sessionManager.login,
    logout: sessionManager.logout,
    refresh: () => tokenService.tryRefreshTokens('manual'),
    user: readonly(sessionManager.user),
    isReady: readonly(sessionManager.isReady),
    isAuthenticated: readonly(sessionManager.isAuthenticated),
    lastError: readonly(lastError),
    // Публичная классификация ошибок — чтобы UI единообразно интерпретировал
    // ошибку login (login по-прежнему бросает сырьё): 'auth' | 'network' | 'unknown'.
    getErrorKind: api.getErrorKind,
  }

  if (config.plugin.autoStart) {
    sessionManager.initialize().catch(error => {
      console.error('Ошибка при инициализации аутентификации', error.message)
    })
  }

  return auth
}
