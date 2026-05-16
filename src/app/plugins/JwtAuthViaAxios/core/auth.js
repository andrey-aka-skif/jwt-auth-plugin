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

  let isRefreshing = false
  let failedQueue = []

  const processQueue = (error, token = null) => {
    failedQueue.forEach(prom =>
      error ? prom.reject(error) : prom.resolve(token)
    )
    failedQueue = []
  }

  const axiosRefreshInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  })

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

    const redirectWhenAuth = router.currentRoute.value?.meta?.redirectWhenAuth

    if (redirectWhenAuth) {
      router.push(redirectWhenAuth)
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

      const redirectWhenNotAuth =
        router.currentRoute.value?.meta?.redirectWhenNotAuth

      if (redirectWhenNotAuth) {
        router.push(redirectWhenNotAuth)
      }
    }
  }

  const refreshToken = async () => {
    // Implement token refresh logic here
  }

  const checkAndRefreshToken = async () => {
    isProcessing.value = true

    const accessToken = localStorage.getItem(config.token.access.storageKey) // или другой способ получения токена

    if (accessToken) {
      const me = await api.me()
      user.value = me.data
    }

    if (isAuthenticated.value) {
      const redirectWhenAuth = router.currentRoute.value?.meta?.redirectWhenAuth

      if (redirectWhenAuth) {
        router.push(redirectWhenAuth)
      }
    } else {
      const redirectWhenNotAuth =
        router.currentRoute.value?.meta?.redirectWhenNotAuth

      if (redirectWhenNotAuth) {
        router.push(redirectWhenNotAuth)
      }
    }

    isProcessing.value = false
  }

  const user = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  const isProcessing = ref(false)

  if (!axiosInstance) {
    throw new Error('Требуется Axios instance')
  }

  if (!router) {
    throw new Error('Не указан объект router')
  }

  if (!api) {
    api = createDefaultApi({ axiosInstance, endpoints: config.endpoints })
  }

  router.beforeEach((to, from, next) => {
    const requireAuth = to.matched.reduceRight(
      (value, record) =>
        record.meta.auth !== undefined ? record.meta.auth : value,
      false
    )

    const redirectWhenNotAuth = to.matched.reduceRight(
      (value, record) =>
        record.meta.redirectWhenNotAuth !== undefined
          ? record.meta.redirectWhenNotAuth
          : value,
      false
    )

    const redirectWhenAuth = to.matched.reduceRight(
      (value, record) =>
        record.meta.redirectWhenAuth !== undefined
          ? record.meta.redirectWhenAuth
          : value,
      false
    )

    if (requireAuth && !isAuthenticated.value) {
      next(redirectWhenNotAuth || '/')
      return
    }

    if (redirectWhenAuth && isAuthenticated.value) {
      next(redirectWhenAuth)
      return
    }

    next()
  })

  axiosInstance.interceptors.request.use(cfg => {
    const accessToken = localStorage.getItem(config.token.access.storageKey) // или другой способ получения токена

    if (accessToken) {
      cfg.headers[config.token.access.sendingKey] = `Bearer ${accessToken}`
    }

    return cfg
  })

  axiosInstance.interceptors.response.use()

  const auth = {
    login,
    logout,
    isAuthenticated,
    isProcessing: readonly(isProcessing),
    checkAndRefreshToken,
    user: readonly(user),
  }

  if (config.plugin.autoStart) {
    auth.checkAndRefreshToken()
  }

  return auth
}
