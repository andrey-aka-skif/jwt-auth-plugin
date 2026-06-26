import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axiosInstance from './shared/api/transport/instance'

import App from './App.vue'
import router from './app/router'
import auth, { createHeyApiAdapter } from '@andrey-aka-skif/jwt-auth-plugin'
import { AUTH_CONFIG, API_SOURCE } from './shared/config'
import { createApiClient } from './shared/api/setup'
import { authOperations } from './shared/api/operations'

import './assets/main.css'

// Источник API выбирается переключателем API_SOURCE (env VITE_API_SOURCE).
// 'generated' — референсный hey-api-адаптер плагина поверх нашего сгенерированного
// SDK; иначе плагин сам создаёт встроенный axios-адаптер (api не передаём).
//
// api передаём ФАБРИКОЙ (config) => adapter: плагин резолвит конфиг и вызывает её
// с готовым конфигом, чтобы адаптер видел дефолты контракта (ключ refresh и т.д.).
// Тот же axiosInstance уходит и в клиент SDK, и в плагин — общий «мост» для
// auth-интерсепторов виден здесь.
let api
if (API_SOURCE === 'generated') {
  const client = createApiClient(axiosInstance)
  api = config =>
    createHeyApiAdapter({ client, operations: authOperations, config })
}

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
