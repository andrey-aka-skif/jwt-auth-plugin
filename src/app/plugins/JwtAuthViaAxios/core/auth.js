import { computed, readonly, ref } from 'vue'
import { DEFAULT_CONFIG } from './defaultConfig'
import { createDefaultApi } from './defaultApi'
import axios from 'axios'

export const createJwtAuthViaAxios = ({
  axiosInstance,
  router,
  api = undefined,
  config = DEFAULT_CONFIG,
}) => {
  config = { ...DEFAULT_CONFIG, ...config }

  const login = async credentials => {
    const response = await api.login(credentials)

    localStorage.setItem(
      config.token.access.storageKey,
      response.data[config.token.access.receivingKey]
    )

    localStorage.setItem(
      config.token.refresh.storageKey,
      response.data[config.token.refresh.receivingKey]
    )

    const me = await api.me()

    user.value = me.data

    if (isAuthenticated.value) {
      startRefreshTimer(
        config.token.refresh?.intervalMinutes,
        config.token.refresh?.intervalTresholdMinutes
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
    stopRefreshTimer()

    const refreshToken = localStorage.getItem(config.token.refresh.storageKey)

    try {
      if (refreshToken) {
        await api.logout({ refresh_token: refreshToken })
      }
    } finally {
      localStorage.removeItem(config.token.access.storageKey)
      localStorage.removeItem(config.token.refresh.storageKey)

      user.value = null

      const redirectOnNotAuthenticated =
        router.currentRoute.value?.meta?.redirectOnNotAuthenticated

      if (redirectOnNotAuthenticated) {
        router.push(redirectOnNotAuthenticated)
      }
    }
  }

  const decodeJwt = token => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(window.atob(base64))
    } catch {
      return null
    }
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
        startRefreshTimer(
          config.token.refresh?.intervalMinutes,
          config.token.refresh?.intervalTresholdMinutes
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
      [config.token.refresh.receivingKey]: refreshToken,
    })

    localStorage.setItem(
      config.token.access.storageKey,
      data[config.token.access.receivingKey]
    )

    localStorage.setItem(
      config.token.refresh.storageKey,
      data[config.token.refresh.receivingKey]
    )
  }

  const checkAndRefreshToken = async () => {
    const accessToken = localStorage.getItem(config.token.access.storageKey)

    if (!accessToken) {
      return false
    }

    const decoded = decodeJwt(accessToken)

    if (decoded?.exp) {
      const expiresIn = decoded.exp * 1000 - Date.now()

      if (expiresIn < config.token.refresh.intervalMinutes * 60 * 1000) {
        try {
          await refreshToken()
        } catch {
          await logout()
          return false
        }
      }
    }

    try {
      const me = await api.me()
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

  const startRefreshTimer = (
    intervalMinutes = 5,
    intervalTresholdMinutes = 1
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
          const decoded = decodeJwt(accessToken)

          if (decoded?.exp) {
            const expiresIn = decoded.exp * 1000 - Date.now()
            // Обновлять за treshold до истечения
            if (
              expiresIn < intervalTresholdMinutes * 60 * 1000 &&
              expiresIn > 0
            ) {
              try {
                await refreshToken()
              } catch (error) {
                console.log('Periodic refresh failed', error)
              }
            }
          }
        } else {
          stopRefreshTimer()
        }
      },
      intervalMinutes * 60 * 1000
    )
  }

  const stopRefreshTimer = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // валидировать конфиг

  if (!axiosInstance) {
    throw new Error('Требуется Axios instance') // заменить: если не указан, то создать
  }

  if (!router) {
    throw new Error('Не указан объект router')
  }

  if (!api) {
    api = createDefaultApi({ axiosInstance, endpoints: config.endpoints })
  }

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
      cfg.headers[config.token.access.sendingKey] = `Bearer ${accessToken}`
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
            originalRequest.headers[config.token.access.sendingKey] =
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
              [config.token.refresh.receivingKey]: refreshToken,
            }
          )

          localStorage.setItem(
            config.token.access.storageKey,
            data[config.token.access.receivingKey]
          )
          localStorage.setItem(
            config.token.refresh.storageKey,
            data[config.token.refresh.receivingKey]
          )

          processQueue(null, data[config.token.access.receivingKey])

          originalRequest.headers[config.token.access.sendingKey] =
            `Bearer ${data[config.token.access.receivingKey]}`

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
