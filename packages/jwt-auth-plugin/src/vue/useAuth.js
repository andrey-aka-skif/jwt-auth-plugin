import { inject } from 'vue'
import { AUTH_KEY } from './symbols'

export const useAuth = () => {
  const auth = inject(AUTH_KEY)

  if (!auth) {
    throw new Error('Auth plugin is not present!')
  }

  return auth
}
