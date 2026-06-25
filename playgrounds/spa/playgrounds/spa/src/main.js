import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axiosInstance from './shared/api/transport/instance'

import App from './App.vue'
import router from './app/router'
import auth from '@andrey-aka-skif/jwt-auth-plugin'
import { AUTH_CONFIG, API_SOURCE } from './shared/config'

import './assets/main.css'

const start = api => {
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
}

// Источник API выбирается переключателем API_SOURCE (env VITE_API_SOURCE).
// 'generated' — сгенерированный @hey-api SDK (тянем динамически, чтобы при
// 'builtin' не подключать SDK в бандл); иначе плагин сам создаёт встроенный
// axios-адаптер (api не передаём).
if (API_SOURCE === 'generated') {
  import('./shared/api/authAdapter').then(({ createSpaAuthAdapter }) => {
    start(createSpaAuthAdapter({ config: AUTH_CONFIG }))
  })
} else {
  start(undefined)
}
