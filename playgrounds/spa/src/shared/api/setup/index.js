import { createClient, createConfig } from '../generated/client'

// Строит собственный экземпляр сгенерированного @hey-api клиента поверх ЯВНО
// переданного axios-инстанса — того самого, на котором плагин повесил
// auth-интерсепторы (инъекция access-токена и рефреш на 401). Возвращаемый
// клиент передаётся в каждый вызов SDK, поэтому глобальный синглтон клиента
// не используется и не мутируется (никаких скрытых side-effect'ов).
//
// baseURL: пути в спеке уже содержат префикс '/api' (например, '/api/auth/login'),
// а axios-инстанс настроен на '.../api/'. Чтобы не получить '/api/api/...',
// клиенту отдаём origin (корень) — путь из спеки добавит '/api' сам.
//
// throwOnError: true — SDK бросает AxiosError при ошибке (как обычный axios),
// что удобно для контракта адаптера (методы бросают, getErrorKind классифицирует).
export const createApiClient = axiosInstance => {
  const baseURL = new URL(import.meta.env.VITE_API_BASE_URL).origin

  return createClient(
    createConfig({
      axios: axiosInstance,
      baseURL,
      throwOnError: true,
    })
  )
}
