import axios from 'axios'

export const createDefaultApiAdapter = ({
  axiosInstance,
  baseURL,
  endpoints,
  config,
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
      const method = config.token.refresh.requestMethod

      if (method === 'header') {
        return axiosRefreshInstance.post(endpoints.refresh, null, {
          headers: {
            [config.token.refresh.requestKey]: refreshToken,
          },
        })
      }

      if (method === 'body') {
        return axiosRefreshInstance.post(endpoints.refresh, {
          [config.token.refresh.requestKey]: refreshToken,
        })
      }

      throw new Error(
        'Неверная конфигурация: неизвестный метод передачи рефреш токена'
      )
    },
  }
}
