export const createDefaultApi = ({
  axiosInstance,
  axiosRefreshInstance,
  endpoints,
}) => {
  const login = async credentials => {
    return await axiosInstance.post(endpoints.login, credentials)
  }

  const logout = async refreshToken => {
    return await axiosInstance.post(endpoints.logout, refreshToken)
  }

  const refresh = async refreshToken => {
    return await axiosRefreshInstance.post(endpoints.refresh, refreshToken)
  }

  const register = async registrationData => {
    return await axiosInstance.post(endpoints.register, registrationData)
  }

  const me = async () => {
    return await axiosInstance.get(endpoints.me)
  }

  return { login, logout, refresh, register, me }
}
