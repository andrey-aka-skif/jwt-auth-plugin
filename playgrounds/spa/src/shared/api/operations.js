import {
  postApiAuthLogin,
  postApiAuthRefresh,
  postApiAuthLogout,
  getApiAuthMe,
} from './generated'

// Простой маппер контракта плагина на конкретные функции сгенерированного
// @hey-api SDK. Имена операций (postApiAuthLogin и т.д.) выводятся из путей спеки
// и живут только здесь — в адаптер они инжектятся, а не хардкодятся.
export const authOperations = {
  login: postApiAuthLogin,
  refresh: postApiAuthRefresh,
  me: getApiAuthMe,
  logout: postApiAuthLogout,
}
