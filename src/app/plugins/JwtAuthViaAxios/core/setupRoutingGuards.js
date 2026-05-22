export const setupRoutingGuards = ({
  router,
  state,
  redirect,
  initializeHandler,
}) => {
  router.beforeEach(async (to, from, next) => {
    if (!state.isReady.value) {
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

    if (requireAuth && !state.isAuthenticated.value) {
      next(redirectOnNotAuthenticated || redirect.onNotAuthenticated)
      return
    }

    if (redirectOnAuthenticated && state.isAuthenticated.value) {
      next(redirectOnAuthenticated)
      return
    }

    next()
  })
}
