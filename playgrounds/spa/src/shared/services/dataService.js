import { ref } from 'vue'
import { getApiProtected } from '../api/generated'

// Пример запроса данных через сгенерированный @hey-api SDK. Клиент сконфигурирован
// в main.js (setupHeyApiClient) на общий axios-инстанс, поэтому запрос проходит
// через auth-интерсепторы плагина (токен подставится, на 401 будет рефреш).
export const useDataService = () => {
  const d = ref(null)

  const getData = async () => {
    try {
      const { data } = await getApiProtected()
      d.value = data
    } catch (error) {
      console.error(error)
    }
  }

  return { data: d, getData }
}
