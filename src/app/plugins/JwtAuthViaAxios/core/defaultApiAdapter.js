import axios from 'axios'

export const createDefaultApiAdapter = ({
  axiosInstance,
  baseURL,
  endpoints,
}) => {
  if (!axiosInstance) {
    throw new Error('Не передан экземпляр axios')
  }

  const axiosRefreshInstance = axios.create({ baseURL })

  return {
    register(registrationData) {
      return axiosInstance.post(endpoints.register, registrationData)
    },
    login(credentials) {
      return axiosInstance.post(endpoints.login, credentials)
    },
    logout(refreshToken) {
      return axiosInstance.post(endpoints.logout, refreshToken)
    },
    me() {
      return axiosInstance.get(endpoints.me)
    },
    refresh(refreshToken) {
      return axiosRefreshInstance.post(endpoints.refresh, refreshToken)
    },
  }
}
