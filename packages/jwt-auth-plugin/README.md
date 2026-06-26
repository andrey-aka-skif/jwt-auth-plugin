# @andrey-aka-skif/jwt-auth-plugin

JWT-аутентификация для Vue 3 + Vue Router поверх axios: хранение токенов,
автоматический рефреш (под Web Locks, с межвкладочной синхронизацией), гарды
маршрутов и редиректы.

Peer-зависимости: `vue` (^3), `vue-router` (^4), `axios`.

## Установка

```bash
npm install @andrey-aka-skif/jwt-auth-plugin
```

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
(`login` / `refresh` / `logout` / `me`) поверх него.

## Конфигурация

Обязательны два поля:

- `api.baseURL` — базовый URL бэкенда;
- `token.access.subKey` — claim в access-токене, идентифицирующий пользователя
  (по нему плагин замечает смену пользователя, в т. ч. между вкладками).

Остальное имеет значения по умолчанию — полный список в
[`src/core/defaultConfig.js`](src/core/defaultConfig.js). Наиболее полезное:

| Параметр                                                 | По умолчанию                     | Назначение                                                                      |
| -------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `endpoints.{login,refresh,logout,register,me}`           | `/api/auth/*`                    | Пути auth-эндпоинтов (относительно `api.baseURL`)                               |
| `storage.namespace`                                      | имя пакета                       | Префикс ключей localStorage; `''` / `null` — без префикса                       |
| `storage.accessTokenKey` / `refreshTokenKey`             | `access-token` / `refresh-token` | Ключи localStorage для токенов                                                  |
| `token.access.requestKey`                                | `Authorization`                  | Заголовок, в который кладётся `Bearer <access>`                                 |
| `token.access.responseKey` / `token.refresh.responseKey` | `access_token` / `refresh_token` | Ключи токенов в теле ответа                                                     |
| `token.refresh.requestKey`                               | `refresh_token`                  | Имя поля/заголовка с refresh-токеном (`'refresh_token'` \| `'X-Refresh-Token'`) |
| `token.refresh.requestMethod`                            | `body`                           | Как передавать refresh-токен: `'body'` \| `'header'`                            |
| `session.logoutStatuses`                                 | `[401]`                          | Статусы ответа, означающие невалидную сессию → разлогин                         |
| `session.keepSessionOnNetworkError`                      | `true`                           | Не рвать сессию при сетевой ошибке рефреша (повторить позже)                    |
| `redirect.onNotAuthenticated`                            | `{ name: 'login' }`              | Куда редиректить гостя с защищённого маршрута                                   |
| `redirect.backToPreviousOnAuthenticated.enabled`         | `true`                           | Возвращать после логина на исходный маршрут (через query)                       |
| `plugin.autoStart` / `plugin.autoRefresh`                | `true` / `true`                  | Старт сессии при установке / фоновый рефреш по таймеру                          |

Токены хранятся в `localStorage` (под `storage.namespace`).

## Публичный API

`useAuth()` возвращает объект сессии:

```js
import { useAuth } from '@andrey-aka-skif/jwt-auth-plugin'

const {
  login,
  logout,
  refresh,
  user,
  isReady,
  isAuthenticated,
  lastError,
  getErrorKind,
} = useAuth()
```

| Поле                  | Назначение                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login(credentials)`  | Логин; `credentials` передаются в тело запроса на `endpoints.login` как есть — их форма определяется вашим бэкендом (например, `{ email, password }`). Пробрасывает исходную ошибку axios |
| `logout()`            | Выход (запрос на сервер + очистка сессии)                                                                                                                                                 |
| `refresh()`           | Ручной рефреш пары токенов                                                                                                                                                                |
| `user`                | `readonly`-ref с данными пользователя (или `null`)                                                                                                                                        |
| `isAuthenticated`     | `readonly`-ref: есть ли активная сессия                                                                                                                                                   |
| `isReady`             | `readonly`-ref: завершена ли инициализация сессии                                                                                                                                         |
| `lastError`           | `readonly`-ref: последняя ошибка рефреша                                                                                                                                                  |
| `getErrorKind(error)` | Классифицирует ошибку: `'auth' \| 'network' \| 'unknown'`                                                                                                                                 |

## Защита маршрутов

Гард читает `meta` маршрутов:

- `meta.auth: true` — маршрут требует аутентификации; гостя редиректит на
  `config.redirect.onNotAuthenticated` (по умолчанию `{ name: 'login' }`);
- `meta.redirectOnAuthenticated` — куда отправить уже аутентифицированного
  (например, со страницы логина);
- при `config.redirect.backToPreviousOnAuthenticated.enabled` исходный путь
  сохраняется в query (`redirect` по умолчанию) и после логина пользователь
  возвращается туда же (только безопасные внутренние пути).

## Как работает рефреш

- **Проактивно (по таймеру).** При `plugin.autoRefresh` шедулер раз в
  `token.refresh.checkIntervalMinutes` (с джиттером `checkJitterPercent`) проверяет
  access-токен и обновляет пару, если до истечения осталось меньше
  `checkIntervalThresholdMinutes`.
- **Реактивно (на 401).** Если запрос вернул статус из `session.logoutStatuses`,
  интерсептор делает рефреш и **один раз** повторяет исходный запрос (флаг `_retry`
  исключает циклы).
- **Один рефреш на все вкладки.** Рефреш идёт под Web Lock
  (`token.refresh.lockKey`, тайм-аут `lockTimeout`), поэтому параллельные запросы и
  вкладки не запускают рефреш одновременно. Обновлённые токены разъезжаются по
  вкладкам через событие `storage`.
- **Гонка вкладок.** Если рефреш вернул auth-ошибку (например, refresh-токен уже
  обновила другая вкладка), плагин перечитывает хранилище до `raceWaitMaxAttempts`
  раз с интервалом `raceWaitIntervalMs` и использует уже обновлённый соседом токен
  вместо разлогина.
- **Сетевой сбой.** При `session.keepSessionOnNetworkError` сетевая ошибка во время
  рефреша не рвёт сессию — попытка повторится на следующем тике шедулера.

## Обработка ошибки входа в UI

`login` пробрасывает исходную ошибку axios (не оборачивая её). Чтобы единообразно
её истолковать, используйте `getErrorKind`:

```js
const { login, getErrorKind } = useAuth()

try {
  await login({ email, password })
} catch (e) {
  switch (getErrorKind(e)) {
    case 'auth':
      showError('Неверный e-mail или пароль')
      break
    case 'network':
      showError('Сервер недоступен')
      break
    default:
      showError('Не удалось войти')
  }
}
```

`getErrorKind` — единая трактовка ошибок: `'auth'` (статус из
`session.logoutStatuses`) → переаутентификация, `'network'` (ответа нет) → при
`session.keepSessionOnNetworkError` сессия сохраняется и рефреш повторяется позже,
иначе — разлогин.

## Работа со сгенерированным SDK (@hey-api и т. п.)

Свои запросы (не auth) приложение делает через собственный SDK. Чтобы на них
действовали те же auth-интерсепторы (токен и рефреш на 401), достаточно, чтобы SDK
ходил через **тот же** `axiosInstance`, что передан плагину:

```js
import axios from 'axios'
import { client } from './api/generated/client.gen'

const axiosInstance = axios.create({ baseURL })

// SDK конфигурируем на тот же инстанс
client.setConfig({ axios: axiosInstance })

app.use(auth, { router, axiosInstance, config })
```

> Рабочий пример целиком — в `playgrounds/spa` (`shared/api/http/httpTransport.js`,
> `shared/api/setup/setupHeyApiClient.js`).
