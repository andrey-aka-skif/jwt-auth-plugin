import { ref } from 'vue'
import axiosInstance from '../api/transport/instance'
import { DEFAULT_CONFIG } from '@/app/plugins/JwtAuthViaAxios/core/defaultConfig'

export const useDataService = () => {
  const d = ref(null)

  const getData = async () => {
    try {
      const uri = `${DEFAULT_CONFIG.api.baseUrl}/protected`

      const { data } = await axiosInstance.get(uri)
      d.value = data
    } catch (error) {
      console.log(error)
    }
  }

  return { data: d, getData }
}
