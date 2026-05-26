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

// удалить
const addRoutingGuards = ({ router, config }) => {
  // router.beforeEach
}

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

  const tokenStorage = createTokenStorage({
    accessTokenStorageKey: config.token.access.storageKey,
    refreshTokenStorageKey: config.token.refresh.storageKey,
  })

  const tokenService = createTokenService({
    tokenStorage,
    api,
    accessTokenExpirationThresholdMs:
      config.token.refresh.checkIntervalThresholdMinutes * 60 * 1000,
    keys: {
      accessTokenResponseKey: config.token.access.requestKey,
      refreshTokenResponseKey: config.token.refresh.requestKey,
    },
  })

  const sessionManager = createSessionManager({
    api,
    tokenService,
    onAuthenticated: () => tryRedirect(),
    onUnauthenticated: () => tryRedirect(),
    keys: {
      accessTokenResponseKey: config.token.access.responseKey,
      refreshTokenResponseKey: config.token.refresh.responseKey,
    },
  })

  const { tryRedirect } = createRedirectRules({ sessionManager, router })

  const initialize_ = async () => {
    console.log('initialize...')
  }

  const startProactiveTokenRefresh_ = () => {
    console.log('startProactiveTokenRefresh...')
  }

  setupInterceptors({
    axiosInstance,
    tokenService,
    onRefreshFailure: () => {
      console.log('onRefreshFailure')
    },
    keys: {
      accessTokenRequestKey: config.token.access.requestKey,
    },
  })

  setupRoutingGuards({
    router,
    sessionManager,
    initializeHandler: initialize_,
    redirect: config.redirect,
  })

  setupCrossTabSync({
    tokenService,
    sessionManager,
    keys: {
      accessTokenKey: config.token.access.storageKey,
      refreshTokenKey: config.token.refresh.storageKey,
    },
  })

  const _auth = {
    login: sessionManager.login,
    logout: sessionManager.logout,
    user: readonly(sessionManager.user),
    isReady: readonly(sessionManager.isReady),
    isAuthenticated: readonly(sessionManager.isAuthenticated),
  }

  if (config.plugin.autoStart) {
    initialize_().catch(error => {
      console.error('Ошибка при инициализации аутентификации', error.message)
    })
  }

  return _auth

  // *************************************

  if (!_api_) {
    _api_ = createDefaultApiAdapter({
      axiosInstance,
      endpoints: config.endpoints,
    })
  }

  if (router) {
    addRoutingGuards({ router, config })
  }

  if (!axiosInstance) {
    axiosInstance = createAxiosInstance(config.api.baseURL)
  }

  if (!axiosInstance) {
    throw new Error('Требуется Axios instance') // заменить: если не указан, то создать
  }

  const login = async credentials => {
    const response = await _api_.login(credentials)

    localStorage.setItem(
      config.token.access.storageKey,
      response.data[config.token.access.responseKey]
    )

    localStorage.setItem(
      config.token.refresh.storageKey,
      response.data[config.token.refresh.responseKey]
    )

    const me = await _api_.me()

    user.value = me.data

    if (isAuthenticated.value) {
      startProactiveTokenRefresh(
        config.token.refresh?.checkIntervalMinutes,
        config.token.refresh?.checkIntervalThresholdMinutes
      )
    }

    // нужно ли делать редирект здесь?
    const redirectOnAuthenticated =
      router.currentRoute.value?.meta?.redirectOnAuthenticated

    if (redirectOnAuthenticated) {
      router.push(redirectOnAuthenticated)
    }
  }

  const logout = async () => {
    stopProactiveTokenRefresh()

    const refreshToken = localStorage.getItem(config.token.refresh.storageKey)

    try {
      if (refreshToken) {
        await _api_.logout({ [config.token.refresh.requestKey]: refreshToken })
      }
    } finally {
      localStorage.removeItem(config.token.access.storageKey)
      localStorage.removeItem(config.token.refresh.storageKey)

      user.value = null

      const redirectOnNotAuthenticated =
        router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
        config.redirect.onNotAuthenticated

      if (redirectOnNotAuthenticated) {
        router.push(redirectOnNotAuthenticated)
      }
    }
  }

  const syncAuthState = async () => {
    const accessToken = localStorage.getItem(config.token.access.storageKey)

    if (!accessToken) {
      // Токена нет — разлогиниваемся, если залогинены
      if (isAuthenticated.value) {
        await logout()
      }
      return
    }

    // Токен есть
    if (!isAuthenticated.value) {
      // Мы не авторизованы, но токен есть — пробуем получить пользователя
      try {
        const me = await _api_.me()
        user.value = me.data

        if (isAuthenticated.value) {
          startProactiveTokenRefresh(
            config.token.refresh?.checkIntervalMinutes,
            config.token.refresh?.checkIntervalThresholdMinutes
          )
        }

        const redirectOnAuthenticated =
          router.currentRoute.value?.meta?.redirectOnAuthenticated

        if (redirectOnAuthenticated) {
          router.push(redirectOnAuthenticated)
        }
      } catch {
        // Токен невалиден — чистим
        localStorage.removeItem(config.token.access.storageKey)
        localStorage.removeItem(config.token.refresh.storageKey)
        user.value = null

        const redirectOnNotAuthenticated =
          router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
          config.redirect.onNotAuthenticated

        if (redirectOnNotAuthenticated) {
          router.push(redirectOnNotAuthenticated)
        }
      }
    } else if (isAuthenticated.value) {
      // Мы уже авторизованы — просто обновляем таймер
      startProactiveTokenRefresh(
        config.token.refresh?.checkIntervalMinutes,
        config.token.refresh?.checkIntervalThresholdMinutes
      )
    }
  }

  const setupCrossTabSynch = () => {
    window.addEventListener('storage', async event => {
      if (
        event.key === config.token.access.storageKey ||
        event.key === config.token.refresh.storageKey
      ) {
        await syncAuthState()
      }
    })
  }

  let initializationPromise = null

  const initialize = async () => {
    if (initializationPromise) {
      return initializationPromise
    }

    initializationPromise = (async () => {
      await checkAndRefreshToken()
      isReady.value = true

      if (isAuthenticated.value) {
        startProactiveTokenRefresh(
          config.token.refresh?.checkIntervalMinutes,
          config.token.refresh?.checkIntervalThresholdMinutes
        )
      }
    })()

    return initializationPromise
  }

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(config.token.refresh.storageKey)

    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const { data } = await axiosRefreshInstance.post(config.endpoints.refresh, {
      [config.token.refresh.requestKey]: refreshToken,
    })

    localStorage.setItem(
      config.token.access.storageKey,
      data[config.token.access.responseKey]
    )

    localStorage.setItem(
      config.token.refresh.storageKey,
      data[config.token.refresh.responseKey]
    )
  }

  const checkAndRefreshToken = async () => {
    const accessToken = localStorage.getItem(config.token.access.storageKey)

    if (!accessToken) {
      return false
    }

    const checkIntervalThresholdMinutes =
      config.token.refresh.checkIntervalThresholdMinutes
    const expiresIn = getTokenRemainingLifetimeMs(accessToken)

    if (
      expiresIn !== null &&
      expiresIn < checkIntervalThresholdMinutes * 60 * 1000
    ) {
      try {
        await refreshToken()
      } catch {
        await logout()
        return false
      }
    }

    try {
      const me = await _api_.me()
      user.value = me.data
      return true
    } catch {
      return false
    }
  }

  const user = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  const isReady = ref(false)

  let refreshTimer = null

  const startProactiveTokenRefresh = (
    intervalMinutes = 5,
    intervalThresholdMinutes = 1
  ) => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }

    if (!isAuthenticated.value) {
      return
    }

    refreshTimer = setInterval(
      async () => {
        if (isAuthenticated.value) {
          const accessToken = localStorage.getItem(
            config.token.access.storageKey
          )

          const expiresIn = getTokenRemainingLifetimeMs(accessToken)

          if (
            expiresIn !== null &&
            expiresIn < intervalThresholdMinutes * 60 * 1000
          ) {
            try {
              await refreshToken()
            } catch (error) {
              console.log('Periodic refresh failed', error)
            }
          }
        } else {
          stopProactiveTokenRefresh()
        }
      },
      intervalMinutes * 60 * 1000
    )
  }

  const stopProactiveTokenRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // валидировать конфиг

  router.beforeEach(async (to, from, next) => {
    if (!isReady.value) {
      await initialize()
    }

    const requireAuth = to.matched.reduceRight(
      (value, record) =>
        record.meta.auth !== undefined ? record.meta.auth : value,
      false
    )

    const redirectOnNotAuthenticated = to.matched.reduceRight(
      (value, record) =>
        record.meta.redirectOnNotAuthenticated !== undefined
          ? record.meta.redirectOnNotAuthenticated
          : value,
      false
    )

    const redirectOnAuthenticated = to.matched.reduceRight(
      (value, record) =>
        record.meta.redirectOnAuthenticated !== undefined
          ? record.meta.redirectOnAuthenticated
          : value,
      false
    )

    if (requireAuth && !isAuthenticated.value) {
      next(redirectOnNotAuthenticated || config.redirect.onNotAuthenticated)
      return
    }

    if (redirectOnAuthenticated && isAuthenticated.value) {
      next(redirectOnAuthenticated)
      return
    }

    next()
  })

  const handleServerUnauthorized = () => {
    if (!isAuthenticated.value) {
      router.push(
        router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
          config.redirect.onNotAuthenticated
      )
    }
  }

  let isRefreshing = false
  let failedQueue = []

  const processQueue = (error, token = null) => {
    failedQueue.forEach(prom =>
      error ? prom.reject(error) : prom.resolve(token)
    )
    failedQueue = []
  }

  const axiosRefreshInstance = axios.create({ baseURL: config.api.baseURL })

  axiosInstance.interceptors.request.use(cfg => {
    const accessToken = localStorage.getItem(config.token.access.storageKey) // или другой способ получения токена

    if (accessToken) {
      cfg.headers[config.token.access.requestKey] = `Bearer ${accessToken}`
    }

    return cfg
  })

  axiosInstance.interceptors.response.use(
    res => res,
    async error => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(token => {
            originalRequest.headers[config.token.access.requestKey] =
              `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const refreshToken = localStorage.getItem(
            config.token.refresh.storageKey
          )

          const { data } = await axiosRefreshInstance.post(
            config.endpoints.refresh,
            {
              [config.token.refresh.requestKey]: refreshToken,
            }
          )

          localStorage.setItem(
            config.token.access.storageKey,
            data[config.token.access.responseKey]
          )
          localStorage.setItem(
            config.token.refresh.storageKey,
            data[config.token.refresh.responseKey]
          )

          processQueue(null, data[config.token.access.responseKey])

          originalRequest.headers[config.token.access.requestKey] =
            `Bearer ${data[config.token.access.requestKey]}`

          return axiosInstance(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)

          localStorage.removeItem(config.token.access.storageKey)
          localStorage.removeItem(config.token.refresh.storageKey)

          user.value = null
          handleServerUnauthorized()

          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      return Promise.reject(error)
    }
  )

  setupCrossTabSynch()

  const auth = {
    login,
    logout,
    isAuthenticated,
    isReady: readonly(isReady),
    checkAndRefreshToken,
    user: readonly(user),
  }

  if (config.plugin.autoStart) {
    initialize().catch(error => {
      console.error('Auth initialization failed', error)
    })
  }

  return auth
}
