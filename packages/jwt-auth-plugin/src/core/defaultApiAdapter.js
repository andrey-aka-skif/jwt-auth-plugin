import axios from 'axios'
import { AuthenticationError } from '../errors/AuthenticationError'
import { formatMessage } from '../shared/utils'

export const createDefaultApiAdapter = ({ axiosInstance, config }) => {
  if (!axiosInstance) {
    throw new Error(formatMessage('Не передан экземпляр axios'))
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
      formatMessage(
        'Неверная конфигурация: неизвестный метод передачи рефреш токена'
      )
    )
  }

  const applyErrorDecorator = async fn => {
    try {
      return await fn()
    } catch (error) {
      if (error.response?.status === 401) {
        throw new AuthenticationError()
      }
      throw error
    }
  }

  return {
    register(registrationData) {
      return axiosInstance.post(config.endpoints.register, registrationData)
    },
    login(credentials) {
      return applyErrorDecorator(() =>
        axiosInstance.post(config.endpoints.login, credentials)
      )
    },
    me() {
      return applyErrorDecorator(() => axiosInstance.get(config.endpoints.me))
    },
    logout(refreshToken) {
      return sendRequestWithRefreshToken(config.endpoints.logout, refreshToken)
    },
    refresh(refreshToken) {
      return applyErrorDecorator(() =>
        sendRequestWithRefreshToken(config.endpoints.refresh, refreshToken)
      )
    },
  }
}
