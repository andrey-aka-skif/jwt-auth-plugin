import axios from 'axios'

// удалить
export const createAxiosInstance = baseURL => {
  return axios.create({ baseURL })
}
