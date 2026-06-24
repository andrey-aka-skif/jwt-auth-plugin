import { formatMessage } from '../shared/utils'

export class AuthenticationError extends Error {
  constructor(message = formatMessage('Аутентификация не удалась')) {
    super(message)
    this.name = 'AuthenticationError'
  }
}
