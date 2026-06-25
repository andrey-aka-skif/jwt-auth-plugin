import axios from 'axios'
import {
  postApiAuthLogin,
  postApiAuthRefresh,
  postApiAuthLogout,
  getApiAuthMe,
} from './generated'
import { configureGeneratedClient } from './setup'

// Адаптер плагина поверх сгенерированного @hey-api SDK (axios-флавор,
// throwOnError: true → методы бросают AxiosError как обычный axios).
//
// Демонстрирует контракт адаптера на реальном сгенерированном клиенте: имена
// операций выводятся из путей спеки (postApiAuthLogin и т.д.), а методы
// контракта (login/refresh/me/logout) мапятся на них здесь.
//
// Подключение в main.js:
//   import { createSpaAuthAdapter } from '@/shared/api/authAdapter'
//   app.use(auth, { router, axiosInstance, api: createSpaAuthAdapter({ config: AUTH_CONFIG }), config: AUTH_CONFIG })
export const createSpaAuthAdapter = ({ config }) => {
  const logoutStatuses = config.session?.logoutStatuses ?? [401]

  // Сконфигурировать сгенерированный клиент (инъекция axios-инстанса).
  configureGeneratedClient()

  return {
    async login(credentials) {
      const { data } = await postApiAuthLogin({ body: credentials })
      return { data }
    },
    async refresh(refreshToken) {
      const { data } = await postApiAuthRefresh({
        body: { refresh_token: refreshToken },
      })
      return { data }
    },
    async me() {
      const { data } = await getApiAuthMe()
      return { data }
    },
    async logout(refreshToken) {
      const { data } = await postApiAuthLogout({
        body: { refresh_token: refreshToken },
      })
      return { data }
    },

    // Клиент axios-флавора → классифицируем по axios-ошибке.
    getErrorKind(error) {
      if (!axios.isAxiosError(error)) {
        return 'unknown'
      }
      if (!error.response) {
        return 'network'
      }
      if (logoutStatuses.includes(error.response.status)) {
        return 'auth'
      }
      return 'unknown'
    },
  }
}
