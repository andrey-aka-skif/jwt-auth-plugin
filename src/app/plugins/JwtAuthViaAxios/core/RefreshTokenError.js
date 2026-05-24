export class RefreshTokenError extends Error {
  constructor(message = 'Не удалось обновить токены') {
    super(message)
    this.name = 'RefreshTokenError'
  }
}
