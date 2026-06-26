import axios from 'axios'
import { formatMessage } from '../shared/utils'

// Встроенный HTTP-клиент поверх axios для auth-эндпоинтов. Создаётся в auth.js,
// публично не экспортируется.
//
//  - методы эндпоинтов вызывают axios и резолвятся в { data };
//  - getErrorKind(error) — единственная точка знания об ошибках этого клиента,
//    возвращает одну категорию: 'auth' | 'network' | 'unknown'.
export const createAxiosClient = ({ axiosInstance, config }) => {
  if (!axiosInstance) {
    throw new Error(formatMessage('Не передан экземпляр axios'))
  }

  // Отдельный инстанс для refresh/logout — без интерсепторов основного,
  // чтобы 401 на refresh не запускал рекурсивный рефреш.
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

  const logoutStatuses = config.session?.logoutStatuses ?? [401]

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

    // Классификация ошибок именно axios-клиента — единственная точка знания.
    getErrorKind(error) {
      // Не axios-ошибка — судить о ней не можем.
      if (!axios.isAxiosError(error)) {
        return 'unknown'
      }

      // Ответа нет — до сервера не достучались. Сессия не обязательно невалидна.
      if (!error.response) {
        return 'network'
      }

      // Сервер явно сообщил, что аутентификация невалидна.
      if (logoutStatuses.includes(error.response.status)) {
        return 'auth'
      }

      return 'unknown'
    },
  }
}
