import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuth } from '@andrey-aka-skif/jwt-auth-plugin'

// Точка нормализации данных пользователя на стороне приложения.
// В режиме session.userSource: 'claims' user — сырой payload токена, где email
// лежит под ClaimTypes-URI; в режиме 'endpoint' /userinfo отдаёт короткий ключ email.
// Стор приводит обе формы к одному полю (плагин намеренно этого не делает).
const EMAIL_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'

export const useUserStore = defineStore('user', () => {
  const { user } = useAuth()

  const email = computed(
    () => user.value?.email ?? user.value?.[EMAIL_CLAIM] ?? null
  )

  return { email }
})
