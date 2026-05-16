import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './app/router'
import auth from './app/plugins/Auth'
import { AUTH_CONFIG } from './shared/config'

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(router)
  .use(auth, { router, api: axios, config: AUTH_CONFIG })
  .mount('#app')
