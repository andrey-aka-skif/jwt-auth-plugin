import {
  appendBackToPreviousQuery,
  formatMessage,
  resolveSavedPath,
} from '../shared/utils'

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

  if (sessionManager.isAuthenticated.value) {
    // При включённой опции возвращаемся на исходную страницу из query,
    // иначе — на стандартную цель meta.redirectOnAuthenticated.
    const savedPath = resolveSavedPath(
      redirectPathes?.backToPreviousOnAuthenticated,
      router.currentRoute.value?.query
    )

    const target = savedPath || redirectOnAuthenticated

    if (target) {
      router.push(target).catch(() => {
        console.error(`Проверьте, что роут '${target}' существует`)
      })
    }

    return
  }

  // Программный редирект на логин нужен только когда сессия потеряна, пока мы
  // уже находимся на защищённой странице (например, упал refresh). При первичной
  // загрузке/прямом вводе URL текущий маршрут ещё не разрешён — навигацию в этом
  // случае полностью обрабатывает гард, и здесь пушить не нужно (иначе голый
  // push на /login выигрывает гонку у гарда и теряет query).
  const current = router.currentRoute.value

  if (current?.meta?.auth && redirectOnNotAuthenticated) {
    // Сохраняем исходный путь в query, чтобы вернуться сюда после логина.
    const target = appendBackToPreviousQuery(
      redirectOnNotAuthenticated,
      redirectPathes?.backToPreviousOnAuthenticated,
      current?.fullPath
    )

    router.push(target).catch(() => {
      console.error(
        formatMessage(
          `Проверьте, что роут '${redirectOnNotAuthenticated}' существует`
        )
      )
    })
  }
}
