export class AuthenticationError extends Error {
  constructor(message = 'Аутентификация не удалась') {
    super(message)
    this.name = 'AuthenticationError'
  }
}
