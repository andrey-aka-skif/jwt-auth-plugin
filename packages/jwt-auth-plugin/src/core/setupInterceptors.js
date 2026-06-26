import { traceLog } from '@andrey-aka-skif/debug-utils'

export const setupInterceptors = ({
  axiosInstance,
  tokenService,
  getErrorKind,
  keys: { accessTokenRequestKey },
}) => {
  const handleResponseError = async error => {
    const originalRequest = error.config

    if (getErrorKind(error) === 'auth' && !originalRequest._retry) {
      return handleUnauthorizedError(originalRequest)
    }

    return Promise.reject(error)
  }

  const handleUnauthorizedError = async originalRequest => {
    originalRequest._retry = true

    try {
      await tokenService.tryRefreshTokens('interceptor')

      const accessToken = tokenService.getAccessToken()

      originalRequest.headers[accessTokenRequestKey] = `Bearer ${accessToken}`

      return axiosInstance(originalRequest)
    } catch (refreshError) {
      traceLog('ИНТЕРСЕПТОР перехватил ошибку', refreshError)

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
