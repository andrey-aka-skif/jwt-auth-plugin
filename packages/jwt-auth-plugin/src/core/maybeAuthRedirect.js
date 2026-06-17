export const maybeAuthRedirect = ({
  sessionManager,
  router,
  redirectPathes,
}) => {
  const redirectOnAuthenticated =
    router.currentRoute.value?.meta?.redirectOnAuthenticated

  const redirectOnNotAuthenticated =
    router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
    redirectPathes?.onNotAuthenticated

  if (sessionManager.isAuthenticated.value && redirectOnAuthenticated) {
    router.push(redirectOnAuthenticated).catch(() => {
      console.error(
        `Проверьте, что роут '${redirectOnAuthenticated}' существует`
      )
    })
  }

  if (!sessionManager.isAuthenticated.value && redirectOnNotAuthenticated) {
    router.push(redirectOnNotAuthenticated).catch(() => {
      console.error(
        `Проверьте, что роут '${redirectOnNotAuthenticated}' существует`
      )
    })
  }
}
