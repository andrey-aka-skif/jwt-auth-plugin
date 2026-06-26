import { client } from '../generated/client.gen'

/**
 * @description Конфигурирует сгенерированный \@hey-api клиент на тот же axios-инстанс, что
 * отдан плагину. Запросы SDK проходят через auth-интерсепторы (инъекция
 * access-токена и рефреш на 401). Сами auth-эндпоинты обслуживает плагин своим
 * встроенным клиентом; SDK нужен приложению для остальных запросов.
 * @param {Object} params - Параметры конфигурации для экземпляра \@hey-api клиента
 */
export const setupHeyApiClient = ({ axios }) => {
  client.setConfig({ axios })
}
