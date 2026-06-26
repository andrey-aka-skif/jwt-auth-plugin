import { inject } from 'vue'
import { AUTH_KEY } from '../shared/symbols'
import { formatMessage } from '../shared/utils'

/**
 * Возвращает сервис аутентификации внутри компонента. Требует установленного
 * плагина (`app.use(...)`), иначе бросает ошибку.
 *
 * @returns {import('../core/auth.js').Auth} Сервис аутентификации.
 * @throws {Error} Если плагин не установлен.
 */
export const useAuth = () => {
  const auth = inject(AUTH_KEY)

  if (!auth) {
    throw new Error(
      formatMessage('Плагин не установлен. Используйте app.use()')
    )
  }

  return auth
}
