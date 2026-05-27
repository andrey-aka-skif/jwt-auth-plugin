// возможно, это часть setupRoutingGuards?

export const createRedirectRules = ({ sessionManager, router }) => {
  const tryRedirect = () => {
    console.log('tryRedirect')

    const redirectOnAuthenticated =
      router.currentRoute.value?.meta?.redirectOnAuthenticated

    const redirectOnNotAuthenticated =
      router.currentRoute.value?.meta?.redirectOnNotAuthenticated

    if (sessionManager.isAuthenticated.value && redirectOnAuthenticated) {
      router.push(redirectOnAuthenticated)
    }

    if (!sessionManager.isAuthenticated.value && redirectOnNotAuthenticated) {
      router.push(redirectOnNotAuthenticated)
    }
  }

  return { tryRedirect }
}
