import { appendBackToPreviousQuery, resolveSavedPath } from '../shared/utils'

export const setupRoutingGuards = ({ router, sessionManager, redirects }) => {
  router.beforeEach(async (to, from, next) => {
    if (!sessionManager.isReady.value) {
      await sessionManager.initialize()
    }

    // vue-router мержит meta всех matched-записей от parent к child (child
    // переопределяет parent) — тот же источник, что у maybeAuthRedirect,
    // поэтому гард и программный редирект резолвят meta одинаково.
    const requireAuth = to.meta.auth
    const redirectOnNotAuthenticated = to.meta.redirectOnNotAuthenticated
    const redirectOnAuthenticated = to.meta.redirectOnAuthenticated

    const backToPrevious = redirects.backToPreviousOnAuthenticated

    // Неаутентифицированный пользователь на защищённой странице:
    // редиректим на логин, при включённой опции сохраняем исходный путь в query.
    if (requireAuth && !sessionManager.isAuthenticated.value) {
      const target = redirectOnNotAuthenticated || redirects.onNotAuthenticated

      next(appendBackToPreviousQuery(target, backToPrevious, to.fullPath))
      return
    }

    // Уже аутентифицированный пользователь на странице для гостей (например,
    // вручную открыл /login?redirect=/profile): при включённой опции и наличии
    // безопасного сохранённого пути возвращаем туда, иначе — стандартная цель.
    if (redirectOnAuthenticated && sessionManager.isAuthenticated.value) {
      const savedPath = resolveSavedPath(backToPrevious, to.query)

      next(savedPath || redirectOnAuthenticated)
      return
    }

    next()
  })
}
