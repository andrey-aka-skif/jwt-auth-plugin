import { useRouter } from 'vue-router'
import { createAuth } from '../plugins/Auth'
import axios from 'axios'

const router = useRouter()

const options = {
  // Add any custom options for the auth plugin here
}

export default createAuth({
  api: axios,
  router,
  options,
})
