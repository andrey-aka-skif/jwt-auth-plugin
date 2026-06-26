import { axiosErrorKind } from './axiosErrorKind'

// Референсный адаптер поверх сгенерированного @hey-api SDK (axios-флавор клиента,
// throwOnError: true → операции бросают AxiosError как обычный axios).
//
// Получает RESOLVED-конфиг плагина (через фабричную форму api в install —
// плагин сам резолвит конфиг и вызывает фабрику), поэтому читает контракт прямо
// из него: ключ тела refresh/logout и статусы разлогина — единое место (config).
//
//  - client     — экземпляр сгенерированного клиента (строится в приложении из
//                 своего axios-инстанса), прокидывается в каждый вызов SDK;
//  - operations — простой маппер контракта на сгенерированные функции:
//                 { login: postApiAuthLogin, refresh: postApiAuthRefresh,
//                   me: getApiAuthMe, logout: postApiAuthLogout }.
export const createHeyApiAdapter = ({ client, operations, config }) => {
  const logoutStatuses = config.session.logoutStatuses
  const refreshKey = config.token.refresh.requestKey

  const call = async (operation, body) => {
    const { data } = await operation({
      client,
      ...(body !== undefined && { body }),
    })

    return { data }
  }

  return {
    login(credentials) {
      return call(operations.login, credentials)
    },
    refresh(refreshToken) {
      return call(operations.refresh, { [refreshKey]: refreshToken })
    },
    me() {
      return call(operations.me)
    },
    logout(refreshToken) {
      return call(operations.logout, { [refreshKey]: refreshToken })
    },

    // Клиент axios-флавора → классифицируем по axios-ошибке.
    getErrorKind(error) {
      return axiosErrorKind(error, logoutStatuses)
    },
  }
}
