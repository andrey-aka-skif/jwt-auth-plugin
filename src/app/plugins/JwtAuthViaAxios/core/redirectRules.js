// возможно, стоит переиеновать и отрефакторить этот файл?

import { __timedDebug__ } from './debug'

export const createRedirectRules = ({ sessionManager, router, redirect }) => {
  const tryRedirect = () => {
    const redirectOnAuthenticated =
      router.currentRoute.value?.meta?.redirectOnAuthenticated

    const redirectOnNotAuthenticated =
      router.currentRoute.value?.meta?.redirectOnNotAuthenticated ||
      redirect?.onNotAuthenticated

    __timedDebug__(router.currentRoute.value, redirectOnAuthenticated)

    if (sessionManager.isAuthenticated.value && redirectOnAuthenticated) {
      router.push(redirectOnAuthenticated)
    }

    if (!sessionManager.isAuthenticated.value && redirectOnNotAuthenticated) {
      router.push(redirectOnNotAuthenticated)
    }
  }

  return { tryRedirect }
}
