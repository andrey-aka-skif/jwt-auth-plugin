import axios from 'axios'

// Классификация ошибки axios-клиента в категорию контракта адаптера.
// Используется и встроенным axios-адаптером, и референсным hey-api-адаптером
// (он работает поверх axios-флавора @hey-api клиента), чтобы логика не разъезжалась.
export const axiosErrorKind = (error, logoutStatuses) => {
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
}
