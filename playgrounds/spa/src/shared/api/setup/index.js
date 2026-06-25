import { client } from '../generated/client.gen'
import instance from '../transport/instance'

// Настраивает сгенерированный @hey-api клиент: заставляет SDK ходить через ТОТ
// ЖЕ axios-инстанс, на котором плагин повесил auth-интерсепторы (инъекция
// access-токена и рефреш на 401). Иначе запросы SDK пойдут мимо аутентификации.
//
// Вызывается лениво (из адаптера), а не на импорте — чтобы при 'builtin'
// побочного эффекта конфигурации не было.
//
// baseURL: пути в спеке уже содержат префикс '/api' (например, '/api/auth/login'),
// а transport/instance настроен на '.../api/'. Чтобы не получить '/api/api/...',
// клиенту отдаём origin (корень сервера) — путь из спеки добавит '/api' сам.
//
// throwOnError: true — SDK бросает AxiosError при ошибке (как обычный axios),
// что удобно для контракта адаптера (методы бросают, getErrorKind классифицирует).
export const configureGeneratedClient = () => {
  const origin = new URL(import.meta.env.VITE_API_BASE_URL).origin

  client.setConfig({
    axios: instance,
    baseURL: origin,
    throwOnError: true,
  })
}
