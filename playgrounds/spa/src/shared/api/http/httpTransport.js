import axios from 'axios'

export const createHttpTransport = ({ baseURL }) => {
  const axiosInstance = axios.create({ baseURL })
  return axiosInstance
}
