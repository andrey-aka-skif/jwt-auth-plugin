import { client } from '../generated/client.gen'

// Конфигурирует сгенерированный @hey-api клиент. SDK ходит через тот же axios-
// инстанс, что отдан плагину, — значит запросы SDK проходят через auth-интерсепторы
// (инъекция access-токена и рефреш на 401). Сами auth-эндпоинты обслуживает плагин
// своим встроенным адаптером; SDK нужен приложению для остальных запросов.
//
// baseURL: пути в спеке уже содержат '/api' (например, '/api/protected'), а инстанс
// настроен на '.../api/'. Клиенту даём origin (корень), чтобы не было '/api/api/...'.
//
// throwOnError: true — SDK бросает AxiosError при ошибке, как обычный axios.
export const setupHeyApiClient = ({ axios }) => {
  const baseURL = new URL(import.meta.env.VITE_API_BASE_URL).origin

  client.setConfig({ axios, baseURL, throwOnError: true })
}
