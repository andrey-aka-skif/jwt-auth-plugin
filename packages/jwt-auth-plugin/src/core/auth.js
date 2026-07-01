import { readonly, ref } from 'vue'
import { DEFAULT_CONFIG } from './defaultConfig'
import { createAxiosClient } from './axiosClient'
import {
  formatMessage,
  resolveConfig,
  resolveStorageKeys,
} from '../shared/utils'
import { setupRoutingGuards } from './setupRoutingGuards'
import { setupCrossTabSync } from './setupCrossTabSync'
import { createTokenService } from './tokenService'
import { createSessionManager } from './sessionManager'
import { createClaimsUserSource, createEndpointUserSource } from './userSource'
import { maybeAuthRedirect } from './maybeAuthRedirect'
import { createTokenStorage } from './tokenStorage'
import { setupInterceptors } from './setupInterceptors'
import { createRefreshScheduler } from './refreshScheduler'

/**
 * Сервис аутентификации, который возвращает {@link createJwtAuthViaAxios}.
 *
 * @typedef {Object} Auth
 * @property {(credentials: Object) => Promise<void>} login Логин по учётным данным.
 * @property {() => Promise<void>} logout Выход (с попыткой logout на сервере).
 * @property {() => Promise<void>} refresh Ручной рефреш токенов.
 * @property {import('vue').Ref<Object|null>} user Текущий пользователь (readonly).
 * @property {import('vue').Ref<boolean>} isReady Готова ли сессия (readonly).
 * @property {import('vue').Ref<boolean>} isAuthenticated Аутентифицирован ли пользователь (readonly).
 * @property {import('vue').Ref<Error|null>} lastError Последняя ошибка (readonly).
 * @property {(error: unknown) => 'auth'|'network'|'unknown'} getErrorKind Классификация ошибки.
 */

/**
 * Создаёт сервис JWT-аутентификации поверх переданного axios-инстанса:
 * настраивает интерсепторы запросов, гарды роутера, фоновый авто-рефреш и
 * межвкладочную синхронизацию сессии.
 *
 * @param {Object} params
 * @param {import('vue-router').Router} params.router Экземпляр vue-router.
 * @param {import('axios').AxiosInstance} params.axiosInstance Экземпляр axios.
 * @param {Object} [params.config] Конфигурация (глубоко мерджится с DEFAULT_CONFIG).
 * @returns {Auth} Объект управления аутентификацией.
 */
export const createJwtAuthViaAxios = ({
  router,
  axiosInstance,
  config = DEFAULT_CONFIG,
}) => {
  if (!router) {
    throw new Error(formatMessage('Требуется экземпляр router'))
  }

  if (!axiosInstance) {
    throw new Error(formatMessage('Требуется экземпляр axios'))
  }

  config = resolveConfig(DEFAULT_CONFIG, config)

  // Встроенный HTTP-клиент поверх переданного axios-инстанса
  const client = createAxiosClient({ axiosInstance, config })

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
    client,
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
        lastError.value = error
        sessionManager.clear()
        maybeAuthRedirectViaAdapter()
      },
      onChangeUser: () => {
        sessionManager.tryRestoreSession()
        maybeAuthRedirectViaAdapter()
      },
    },
  })

  // Источник данных пользователя:
  // 'claims' - claims из токена (по умолчанию)
  // 'endpoint' - сетевой запрос к /userinfo
  const userSource =
    config.session.userSource === 'endpoint'
      ? createEndpointUserSource({ client })
      : createClaimsUserSource({ tokenService })

  sessionManager = createSessionManager({
    client,
    tokenService,
    userSource,
    keys: {
      accessTokenResponseKey: config.token.access.responseKey,
      refreshTokenResponseKey: config.token.refresh.responseKey,
    },
    callbacks: {
      onRestoreSession: () => {
        scheduler?.start()
        maybeAuthRedirectViaAdapter()
      },
      onClearSession: () => {
        scheduler?.stop()
        maybeAuthRedirectViaAdapter()
      },
    },
  })

  setupInterceptors({
    axiosInstance,
    tokenService,
    getErrorKind: client.getErrorKind,
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
      onTokenChange: () => sessionManager.tryRestoreSession(),
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
          await tokenService.tryRefreshTokens()
        },
      },
    })
  }

  const auth = {
    login: sessionManager.login,
    logout: sessionManager.logout,
    refresh: () => tokenService.tryRefreshTokens(),
    user: readonly(sessionManager.user),
    isReady: readonly(sessionManager.isReady),
    isAuthenticated: readonly(sessionManager.isAuthenticated),
    lastError: readonly(lastError),
    // Публичная классификация ошибок — чтобы UI единообразно интерпретировал
    // ошибку login (login пробрасывает исходную ошибку): 'auth' | 'network' | 'unknown'.
    getErrorKind: client.getErrorKind,
  }

  if (config.plugin.autoStart) {
    sessionManager.initialize().catch(error => {
      console.error('Ошибка при инициализации аутентификации', error.message)
    })
  }

  return auth
}
