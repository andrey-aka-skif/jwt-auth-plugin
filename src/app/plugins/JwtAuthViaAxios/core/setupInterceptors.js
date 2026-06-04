import { __timedDebug__ } from './debug'
import { RefreshTokenError } from '../errors/RefreshTokenError'

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
      const { accessToken } = await tokenService.refreshTokens()

      originalRequest.headers[accessTokenRequestKey] = `Bearer ${accessToken}`

      return axiosInstance(originalRequest)
    } catch (refreshError) {
      __timedDebug__('ИНТЕРСЕПТОР перехватил ошибку')

      __timedDebug__(
        'ОШИБКА при рефреше токена в ИНТЕРСЕПТОРЕ:',
        refreshError,
        'refreshError instanceof RefreshTokenError:',
        refreshError instanceof RefreshTokenError
      )

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
