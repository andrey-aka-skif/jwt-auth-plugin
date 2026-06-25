// Референс-адаптер под клиент, сгенерированный @hey-api/openapi-ts.
// Экспортируется публично — и как готовый адаптер, и как образец для написания
// своих адаптеров под произвольный API-клиент.
//
// ВАЖНО: точная форма результата и ошибок зависит от версии @hey-api и
// выбранного клиента (fetch / axios). hey-api по умолчанию НЕ бросает, а
// возвращает { data, error, response }. Подгоняйте обращения к полям
// (response.ok, response.status, форму error) под свою генерацию — вся
// клиент-специфичная логика локализована в этом файле.
//
// Контракт (как у axiosAdapter):
//  - методы резолвятся в { data }; при ошибке бросают;
//  - getErrorKind(error) → 'auth' | 'network' | 'unknown'.
export const createHeyApiAdapter = ({ sdk, config }) => {
  const logoutStatuses = config.session?.logoutStatuses ?? [401]

  // hey-api возвращает { data, error, response } и не бросает. Плагин построен
  // на бросках и ждёт форму { data } — разворачиваем результат здесь.
  const unwrap = async promise => {
    const { data, error, response } = await promise

    if (error || !response?.ok) {
      // Прикрепляем response, чтобы getErrorKind увидел статус.
      throw Object.assign(new Error('API error'), { response, cause: error })
    }

    return { data }
  }

  return {
    register(registrationData) {
      return unwrap(sdk.register({ body: registrationData }))
    },
    login(credentials) {
      return unwrap(sdk.login({ body: credentials }))
    },
    me() {
      return unwrap(sdk.me())
    },
    logout(refreshToken) {
      return unwrap(sdk.logout({ body: { refresh_token: refreshToken } }))
    },
    refresh(refreshToken) {
      return unwrap(sdk.refresh({ body: { refresh_token: refreshToken } }))
    },

    getErrorKind(error) {
      const status = error?.response?.status

      // Нет статуса — ответа не было (сетевой сбой / исключение клиента).
      if (status === undefined) {
        return 'network'
      }

      if (logoutStatuses.includes(status)) {
        return 'auth'
      }

      return 'unknown'
    },
  }
}
