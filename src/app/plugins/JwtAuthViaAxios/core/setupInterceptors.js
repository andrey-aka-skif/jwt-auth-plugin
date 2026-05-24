export const setupInterceptors = ({
  axiosInstance,
  tokenService,
  sessionManager,
  accessTokenResponseKey,
  accessTokenRequestKey,
}) => {
  const handleResponseError = async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { accessToken } = await tokenService.refreshTokens()

        originalRequest.headers[accessTokenResponseKey] =
          `Bearer ${accessToken}`

        return axiosInstance(originalRequest)
      } catch (refreshError) {
        sessionManager.onAuthFailure()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
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
