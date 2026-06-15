import { ref } from 'vue'
import axiosInstance from '../api/transport/instance'

export const useDataService = () => {
  const d = ref(null)

  const getData = async () => {
    try {
      const { data } = await axiosInstance.get('protected')
      d.value = data
    } catch (error) {
      console.log(error)
    }
  }

  return { data: d, getData }
}
