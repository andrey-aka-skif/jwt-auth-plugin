import { __timedDebug__ } from './debug'

export const setupInterceptors = ({
  axiosInstance,
  tokenService,
  keys: { accessTokenRequestKey },
}) => {
  const handleResponseError = async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      return handleUnauthorizedError(originalRequest)
    }

    return Promise.reject(error)
  }

  const handleUnauthorizedError = async originalRequest => {
    originalRequest._retry = true

    try {
      await tokenService.tryRefreshTokens('interseptor')

      const accessToken = tokenService.getAccessToken()

      originalRequest.headers[accessTokenRequestKey] = `Bearer ${accessToken}`

      return axiosInstance(originalRequest)
    } catch (refreshError) {
      __timedDebug__('ИНТЕРСЕПТОР перехватил ошибку', refreshError)

      return Promise.reject(refreshError)
    }
  }

  axiosInstance.interceptors.response.use(
    response => response,
    async error => handleResponseError(error)
  )

  axiosInstance.interceptors.request.use(config => {
    const accessToken = tokenService.getAccessToken()

    if (accessToken) {
      config.headers[accessTokenRequestKey] = `Bearer ${accessToken}`
    }

    return config
  })
}
