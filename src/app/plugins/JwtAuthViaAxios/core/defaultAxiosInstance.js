import axios from 'axios'
import { DEFAULT_CONFIG } from './defaultConfig'

export const createDefaultAxiosInstance = () => {
  const baseURL = DEFAULT_CONFIG.api.baseURL
  return axios.create({ baseURL })
}
