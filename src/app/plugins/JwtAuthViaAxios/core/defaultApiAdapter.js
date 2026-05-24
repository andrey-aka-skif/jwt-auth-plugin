import axios from 'axios'

export const createDefaultApiAdapter = ({ axiosInstance, config }) => {
  if (!axiosInstance) {
    throw new Error('Не передан экземпляр axios')
  }

  const axiosRefreshInstance = axios.create({ baseURL: config.api.baseURL })

  const sendRequestWithRefreshToken = (endpoint, refreshToken) => {
    const method = config.token.refresh.requestMethod

    if (method === 'header') {
      return axiosRefreshInstance.post(endpoint, null, {
        headers: {
          [config.token.refresh.requestKey]: refreshToken,
        },
      })
    }

    if (method === 'body') {
      return axiosRefreshInstance.post(endpoint, {
        [config.token.refresh.requestKey]: refreshToken,
      })
    }

    throw new Error(
      'Неверная конфигурация: неизвестный метод передачи рефреш токена'
    )
  }

  return {
    register(registrationData) {
      return axiosInstance.post(config.endpoints.register, registrationData)
    },
    login(credentials) {
      return axiosInstance.post(config.endpoints.login, credentials)
    },
    me() {
      return axiosInstance.get(config.endpoints.me)
    },
    logout(refreshToken) {
      return sendRequestWithRefreshToken(config.endpoints.logout, refreshToken)
    },
    refresh(refreshToken) {
      return sendRequestWithRefreshToken(config.endpoints.refresh, refreshToken)
    },
  }
}
