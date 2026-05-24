export const setupRoutingGuards = ({
  router,
  sessionManager,
  redirect,
  initializeHandler,
}) => {
  router.beforeEach(async (to, from, next) => {
    if (!sessionManager.isReady.value) {
      await initializeHandler?.()
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

    if (requireAuth && !sessionManager.isAuthenticated.value) {
      next(redirectOnNotAuthenticated || redirect.onNotAuthenticated)
      return
    }

    if (redirectOnAuthenticated && sessionManager.isAuthenticated.value) {
      next(redirectOnAuthenticated)
      return
    }

    next()
  })
}
