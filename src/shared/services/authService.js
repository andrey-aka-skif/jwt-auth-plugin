import { computed } from 'vue'
import { useAuth } from '@/app/plugins/Auth'

export const useAuthService = () => {
  const auth = useAuth()

  const login = async credentials => {
    await auth.login({ data: credentials })
  }

  const logout = () => {
    auth.logout()
  }

  const isAuthenticated = computed(() => {
    return auth.check()
  })

  const user = computed(() => {
    return auth.user()
  })

  return {
    rawAuth: auth,
    login,
    logout,
    isAuthenticated,
    user,
  }
}
