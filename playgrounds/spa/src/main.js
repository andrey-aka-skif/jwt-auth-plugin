import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHttpTransport } from './shared/api/http/httpTransport'
import { setupHeyApiClient } from './shared/api/setup/setupHeyApiClient'

import App from './App.vue'
import router from './app/router'
import auth from '@andrey-aka-skif/jwt-auth-plugin'
import { AUTH_CONFIG } from './shared/config'

import './assets/main.css'

const baseURL = import.meta.env.VITE_API_BASE_URL
const httpTransport = createHttpTransport({ baseURL })
setupHeyApiClient({ axios: httpTransport })

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(router)
  .use(auth, {
    router,
    axiosInstance: httpTransport,
    config: AUTH_CONFIG,
  })
  .mount('#app')
