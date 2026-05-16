import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axiosInstance from './shared/api/transport/instance'

import App from './App.vue'
import router from './app/router'
import auth from './app/plugins/JwtAuthViaAxios'
import { AUTH_CONFIG } from './shared/config'

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(router)
  .use(auth, {
    router,
    axiosInstance,
    config: AUTH_CONFIG,
  })
  .mount('#app')
