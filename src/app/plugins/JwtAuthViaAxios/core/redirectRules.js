// возможно, это часть setupRoutingGuards?

export const createRedirectRules = ({ sessionManager, router, redirect }) => {
  const tryRedirect = () => {
    const redirectOnAuthenticated =
      router.currentRoute.value?.meta?.redirectOnAuthenticated

    const redirectOnNotAuthenticated =
      router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
      redirect?.onNotAuthenticated

    console.log('tryRedirect')
    console.log('router.currentRoute.value', router.currentRoute.value)
    console.log('redirectOnAuthenticated', redirectOnAuthenticated)
    console.log('redirectOnNotAuthenticated', redirectOnNotAuthenticated)
    console.log(
      'sessionManager.isAuthenticated.value',
      sessionManager.isAuthenticated.value
    )

    if (sessionManager.isAuthenticated.value && redirectOnAuthenticated) {
      router.push(redirectOnAuthenticated)
    }

    if (!sessionManager.isAuthenticated.value && redirectOnNotAuthenticated) {
      router.push(redirectOnNotAuthenticated)
    }
  }

  return { tryRedirect }
}
