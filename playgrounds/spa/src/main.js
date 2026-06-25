import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axiosInstance from './shared/api/transport/instance'

import App from './App.vue'
import router from './app/router'
import auth from '@andrey-aka-skif/jwt-auth-plugin'
import { AUTH_CONFIG, API_SOURCE } from './shared/config'
import { createSpaAuthAdapter } from './shared/api/authAdapter'

import './assets/main.css'

// Источник API выбирается переключателем API_SOURCE (env VITE_API_SOURCE).
// 'generated' — адаптер поверх сгенерированного @hey-api SDK; иначе плагин сам
// создаёт встроенный axios-адаптер (api не передаём).
const api =
  API_SOURCE === 'generated'
    ? createSpaAuthAdapter({ config: AUTH_CONFIG })
    : undefined

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(router)
  .use(auth, {
    router,
    axiosInstance,
    api,
    config: AUTH_CONFIG,
  })
  .mount('#app')
