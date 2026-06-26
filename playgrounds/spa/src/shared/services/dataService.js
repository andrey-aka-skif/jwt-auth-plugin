import { ref } from 'vue'
import { getApiProtected } from '../api/generated'

// Пример запроса данных через сгенерированный @hey-api SDK. Клиент сконфигурирован
// в main.js (setupHeyApiClient) на общий axios-инстанс, поэтому запрос проходит
// через auth-интерсепторы плагина (токен подставится, на 401 будет рефреш).
//
// SDK сконфигурирован как есть (без throwOnError), поэтому возвращает { data, error }.
export const useDataService = () => {
  const data = ref(null)

  const fetchData = async () => {
    const { data: apiData, error } = await getApiProtected()

    if (error) {
      console.error(error)
      return
    }

    data.value = apiData
  }

  return { data, fetchData }
}
