import { createRouter, createWebHistory } from 'vue-router'
import TheHomeView from '../views/TheHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TheHomeView,
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/TheNotFoundView.vue'),
    },
    {
      path: '/404',
      name: 'not-found',
      component: () => import('../views/TheNotFoundView.vue'),
    },
  ],
})

export default router
