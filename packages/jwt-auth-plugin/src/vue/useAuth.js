import { inject } from 'vue'
import { AUTH_KEY } from '../shared/symbols'
import { formatMessage } from '../shared/utils'

export const useAuth = () => {
  const auth = inject(AUTH_KEY)

  if (!auth) {
    throw new Error(
      formatMessage('Плагин не установлен. Используйте app.use()')
    )
  }

  return auth
}
