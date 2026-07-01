// Источник данных пользователя для восстановления сессии (session.userSource).
// Стратегия с единственным методом resolveUser():
//   - Object — данные для user.value;
//   - null   — валидной сессии больше нет (сессия уже очищена побочно, например
//              при провале рефреша) → sessionManager трактует как clear + стоп;
//   - throw  — обрабатывается sessionManager как ошибка → clear().
//
// Выбор стратегии — в auth.js по config.session.userSource.

// 'claims': данные берутся из claims access-токена, без сетевого запроса.
//
// Рефрешим ТОЛЬКО если токен реально истёк (как endpoint-режим рефрешил лишь
// при 401 на /userinfo). Пока токен валиден — просто читаем claims, не трогая
// рефреш: иначе восстанавливающая/реагирующая вкладка ротировала бы RT (токен
// почти всю жизнь «в пороге») и провоцировала межвкладочную гонку по RT.
// Рефреш истёкшего токена заменяет прежний путь /userinfo → 401 → refresh (F5
// после простоя), сохраняя сессию, пока жив refresh-токен.
export const createClaimsUserSource = ({ tokenService }) => ({
  resolveUser: async () => {
    if (!tokenService.isAccessTokenExpired()) {
      return tokenService.getAccessTokenClaims()
    }

    await tokenService.tryRefreshTokens()

    if (!tokenService.isAccessTokenExist()) {
      return null
    }

    return tokenService.getAccessTokenClaims()
  },
})

// 'endpoint': профиль запрашивается с сервера (прежнее поведение плагина).
export const createEndpointUserSource = ({ client }) => ({
  resolveUser: async () => {
    const userinfo = await client.getUserinfo()
    return userinfo.data
  },
})
