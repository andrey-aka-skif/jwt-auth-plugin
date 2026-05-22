import { useAuth } from '@/app/plugins/JwtAuthViaAxios'

export const useAuthService = () => {
  const auth = useAuth()

  return {
    login: auth.login,
    logout: auth.logout,
    user: auth.user,
    isReady: auth.isReady,
    isAuthenticated: auth.isAuthenticated,
  }
}
