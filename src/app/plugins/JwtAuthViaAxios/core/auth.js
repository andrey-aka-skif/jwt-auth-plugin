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

    const redirectOnAuthenticated =
      router.currentRoute.value?.meta?.redirectOnAuthenticated

    if (redirectOnAuthenticated) {
      router.push(redirectOnAuthenticated)
    }
  }

  const logout = async () => {
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

  const refreshToken = async () => {
    // Implement token refresh logic here
  }

  const checkAndRefreshToken = async () => {
    const accessToken = localStorage.getItem(config.token.access.storageKey) // или другой способ получения токена

    if (accessToken) {
      const me = await api.me()
      user.value = me.data
    }

    // здесь нужно обновить токены
  }

  const user = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  const isReady = ref(false)

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
      await checkAndRefreshToken()
      isReady.value = true
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
    const foo =
      router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
      config.redirect.onNotAuthenticated

    console.log(foo)

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
    auth.checkAndRefreshToken()
  }

  return auth
}
