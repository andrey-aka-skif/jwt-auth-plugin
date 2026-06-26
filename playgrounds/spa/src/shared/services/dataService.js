import { ref } from 'vue'
import { getApiProtected } from '../api/generated'

// Пример запроса данных через сгенерированный @hey-api SDK. Клиент сконфигурирован
// в main.js (setupHeyApiClient) на общий axios-инстанс, поэтому запрос проходит
// через auth-интерсепторы плагина (токен подставится, на 401 будет рефреш).
//
// SDK сконфигурирован как есть (без throwOnError), поэтому возвращает { data, error }.
export const useDataService = () => {
  const d = ref(null)

  const getData = async () => {
    const { data, error } = await getApiProtected()

    if (error) {
      console.error(error)
      return
    }

    d.value = data
  }

  return { data: d, getData }
}
