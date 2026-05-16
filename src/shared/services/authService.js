import { computed } from 'vue'
import { useAuth } from '@/app/plugins/JwtAuthViaAxios'

export const useAuthService = () => {
  const {
    login: libLogin,
    logout: libLogout,
    isAuthenticated: libIsAuthenticated,
    user: libUser,
  } = useAuth()

  const login = async credentials => {
    return await libLogin(credentials)
  }

  const logout = () => {
    return libLogout()
  }

  const isAuthenticated = computed(() => {
    return libIsAuthenticated.value
  })

  const user = computed(() => {
    return libUser.value
  })

  return {
    login,
    logout,
    isAuthenticated,
    user,
  }
}
