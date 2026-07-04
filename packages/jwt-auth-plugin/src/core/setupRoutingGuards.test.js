import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { setupRoutingGuards } from './setupRoutingGuards'

// Гард тестируем на реальном vue-router (memory history), чтобы резолвинг
// meta вложенных маршрутов совпадал с боевым: vue-router мержит meta
// от parent к child, child переопределяет parent (см. issue #10).

const Dummy = {}

const createGuardedRouter = ({ routes, isAuthenticated = false }) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Dummy },
      { path: '/login', component: Dummy },
      ...routes,
    ],
  })

  const sessionManager = {
    isReady: { value: true },
    isAuthenticated: { value: isAuthenticated },
    initialize: async () => {},
  }

  setupRoutingGuards({
    router,
    sessionManager,
    redirects: {
      onNotAuthenticated: '/login',
      backToPreviousOnAuthenticated: { enabled: false },
    },
  })

  return router
}

describe('setupRoutingGuards: meta вложенных маршрутов (child переопределяет parent)', () => {
  it('пускает гостя на child с auth: false внутри parent с auth: true', async () => {
    const router = createGuardedRouter({
      routes: [
        {
          path: '/secure',
          component: Dummy,
          meta: { auth: true },
          children: [
            { path: 'public', component: Dummy, meta: { auth: false } },
          ],
        },
      ],
      isAuthenticated: false,
    })

    await router.push('/secure/public')

    expect(router.currentRoute.value.path).toBe('/secure/public')
  })

  it('редиректит гостя с child без своей меты (наследует auth: true родителя)', async () => {
    const router = createGuardedRouter({
      routes: [
        {
          path: '/secure',
          component: Dummy,
          meta: { auth: true },
          children: [{ path: 'inner', component: Dummy }],
        },
      ],
      isAuthenticated: false,
    })

    await router.push('/secure/inner')

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('использует redirectOnNotAuthenticated child, а не parent', async () => {
    const router = createGuardedRouter({
      routes: [
        { path: '/login-a', component: Dummy },
        { path: '/login-b', component: Dummy },
        {
          path: '/secure',
          component: Dummy,
          meta: { auth: true, redirectOnNotAuthenticated: '/login-a' },
          children: [
            {
              path: 'special',
              component: Dummy,
              meta: { redirectOnNotAuthenticated: '/login-b' },
            },
          ],
        },
      ],
      isAuthenticated: false,
    })

    await router.push('/secure/special')

    expect(router.currentRoute.value.path).toBe('/login-b')
  })

  it('использует redirectOnAuthenticated child, а не parent', async () => {
    const router = createGuardedRouter({
      routes: [
        { path: '/profile', component: Dummy },
        {
          path: '/guest',
          component: Dummy,
          meta: { redirectOnAuthenticated: '/' },
          children: [
            {
              path: 'entry',
              component: Dummy,
              meta: { redirectOnAuthenticated: '/profile' },
            },
          ],
        },
      ],
      isAuthenticated: true,
    })

    await router.push('/guest/entry')

    expect(router.currentRoute.value.path).toBe('/profile')
  })
})
