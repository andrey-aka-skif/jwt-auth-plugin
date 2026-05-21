import axios from 'axios'

export const createAxiosInstance = baseURL => {
  return axios.create({ baseURL })
}
