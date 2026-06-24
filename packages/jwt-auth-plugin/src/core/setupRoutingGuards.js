import { appendBackToPreviousQuery, resolveSavedPath } from '../shared/utils'

export const setupRoutingGuards = ({ router, sessionManager, redirects }) => {
  router.beforeEach(async (to, from, next) => {
    if (!sessionManager.isReady.value) {
      await sessionManager.initialize()
    }

    const requireAuth = to.matched.reduceRight(
      (value, record) =>
        record.meta.auth !== undefined ? record.meta.auth : value,
      false
    )

    const redirectOnNotAuthenticated = to.matched.reduceRight(
      (value, record) =>
        record.meta.redirectOnNotAuthenticated !== undefined
          ? record.meta.redirectOnNotAuthenticated
          : value,
      false
    )

    const redirectOnAuthenticated = to.matched.reduceRight(
      (value, record) =>
        record.meta.redirectOnAuthenticated !== undefined
          ? record.meta.redirectOnAuthenticated
          : value,
      false
    )

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
