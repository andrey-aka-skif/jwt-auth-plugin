# @andrey-aka-skif/jwt-auth-plugin

JWT-аутентификация для Vue 3 + Vue Router поверх axios: хранение токенов,
автоматический рефреш (под Web Locks, с межвкладочной синхронизацией), гарды
маршрутов и редиректы.

## Установка

```js
import { createApp } from 'vue'
import auth from '@andrey-aka-skif/jwt-auth-plugin'
import router from './router'
import axiosInstance from './api/instance'

createApp(App)
  .use(router)
  .use(auth, {
    router,
    axiosInstance,
    config: {
      api: { baseURL: import.meta.env.VITE_API_BASE_URL },
      token: { access: { subKey: 'sub' } },
    },
  })
  .mount('#app')
```

Плагин вешает на переданный `axiosInstance` интерсепторы (подстановка
access-токена в запросы и рефреш при 401) и обслуживает auth-эндпоинты
(`login` / `refresh` / `logout` / `me`) поверх него. Обязательные поля конфига —
`api.baseURL` и `token.access.subKey` (claim, по которому различается пользователь
в access-токене); остальное со значениями по умолчанию см. в
[`src/core/defaultConfig.js`](src/core/defaultConfig.js).

## Публичный API

`useAuth()` возвращает объект сессии:

```js
import { useAuth } from '@andrey-aka-skif/jwt-auth-plugin'

const { login, logout, refresh, user, isReady, isAuthenticated, lastError, getErrorKind } = useAuth()
```

| Поле | Назначение |
|------|------------|
| `login(credentials)` | Логин; пробрасывает исходную ошибку axios (не оборачивает) |
| `logout()` | Выход (запрос на сервер + очистка сессии) |
| `refresh()` | Ручной рефреш пары токенов |
| `user` | `readonly`-ref с данными пользователя (или `null`) |
| `isAuthenticated` | `readonly`-ref: есть ли активная сессия |
| `isReady` | `readonly`-ref: завершена ли инициализация сессии |
| `lastError` | `readonly`-ref: последняя ошибка рефреша |
| `getErrorKind(error)` | Классифицирует ошибку: `'auth' \| 'network' \| 'unknown'` |

## Защита маршрутов

Гард читает `meta` маршрутов:

- `meta.auth: true` — маршрут требует аутентификации; неаутентифицированного
  редиректит на `config.redirect.onNotAuthenticated` (по умолчанию `{ name: 'login' }`);
- `meta.redirectOnAuthenticated` — куда отправить уже аутентифицированного
  (например, со страницы логина);
- при `config.redirect.backToPreviousOnAuthenticated.enabled` исходный путь
  сохраняется в query (`redirect` по умолчанию) и после логина пользователь
  возвращается туда же (только безопасные внутренние пути).

## Обработка ошибки входа в UI

`login` пробрасывает исходную ошибку axios (не оборачивая её). Чтобы единообразно
её истолковать, используйте `getErrorKind`:

```js
const { login, getErrorKind } = useAuth()

try {
  await login({ email, password })
} catch (e) {
  switch (getErrorKind(e)) {
    case 'auth':    showError('Неверный e-mail или пароль'); break
    case 'network': showError('Сервер недоступен'); break
    default:        showError('Не удалось войти')
  }
}
```

`getErrorKind` — единая трактовка ошибок: `'auth'` (статус из
`config.session.logoutStatuses`, по умолчанию `[401]`) → переаутентификация,
`'network'` (ответа нет) → при `config.session.keepSessionOnNetworkError` сессия
сохраняется и рефреш повторяется позже, иначе — разлогин.

## Работа со сгенерированным SDK (@hey-api и т. п.)

Свои запросы (не auth) приложение делает через собственный SDK. Чтобы на них
действовали те же auth-интерсепторы (токен и рефреш на 401), достаточно, чтобы SDK
ходил через **тот же** `axiosInstance`, что передан плагину:

```js
import { client } from './api/generated/client.gen'

const axiosInstance = createHttpTransport({ baseURL })

// SDK конфигурируем на тот же инстанс
client.setConfig({ axios: axiosInstance })

app.use(auth, { router, axiosInstance, config })
```

> Рабочий пример целиком — в `playgrounds/spa` (`shared/api/http/httpTransport.js`,
> `shared/api/setup/setupHeyApiClient.js`).
