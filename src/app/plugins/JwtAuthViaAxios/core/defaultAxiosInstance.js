import axios from 'axios'

export const createDefaultAxiosInstance = baseURL => {
  return axios.create({ baseURL })
}
