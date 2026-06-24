import { formatMessage } from '../shared/utils'

// Сервер недоступен: ответа нет (сеть упала, DNS, CORS-блок, тайм-аут).
// В отличие от AuthenticationError не означает, что сессия невалидна —
// проблема может быть временной, и рефреш стоит повторить позже.
export class NetworkError extends Error {
  constructor(
    message = formatMessage('Сетевая ошибка: сервер недоступен'),
    { cause } = {}
  ) {
    super(message)
    this.name = 'NetworkError'
    this.cause = cause
  }
}
