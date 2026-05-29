// возможно, это часть setupRoutingGuards?

import { __timedDebug__ } from './utils'

export const createRedirectRules = ({ sessionManager, router, redirect }) => {
  const tryRedirect = () => {
    __timedDebug__()

    const redirectOnAuthenticated =
      router.currentRoute.value?.meta?.redirectOnAuthenticated

    const redirectOnNotAuthenticated =
      router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
      redirect?.onNotAuthenticated

    if (sessionManager.isAuthenticated.value && redirectOnAuthenticated) {
      router.push(redirectOnAuthenticated)
    }

    if (!sessionManager.isAuthenticated.value && redirectOnNotAuthenticated) {
      router.push(redirectOnNotAuthenticated)
    }
  }

  return { tryRedirect }
}
