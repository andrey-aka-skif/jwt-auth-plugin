import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './app/router'
import auth from './app/auth'

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia).use(router).use(auth).mount('#app')
