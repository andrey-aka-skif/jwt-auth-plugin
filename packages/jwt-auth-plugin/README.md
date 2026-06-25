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

`api` в опциях `install` необязателен — если он не передан, плагин сам создаёт
дефолтный адаптер поверх переданного `axiosInstance`.

## Адаптеры API

Плагин общается с бэкендом через **адаптер** — объект, который инкапсулирует и
вызовы эндпоинтов, и трактовку ошибок конкретного клиента. Это позволяет
подключить любой клиент (axios, fetch, сгенерированный @hey-api SDK и т. п.).

### Контракт адаптера

| Член | Назначение |
|------|------------|
| `login(credentials)` | Резолвится в `{ data }` с токенами под ключами из конфига |
| `refresh(refreshToken)` | Резолвится в `{ data }` с новой парой токенов |
| `me()` | Резолвится в `{ data }` с пользователем |
| `logout(refreshToken)` | Завершает сессию на сервере |
| `register(data)` | Регистрация |
| `getErrorKind(error)` | Классифицирует ошибку клиента: `'auth' \| 'network' \| 'unknown'` |

- Методы при ошибке **бросают** сырьё клиента — оборачивать в свои типы не нужно.
- `getErrorKind` — единственная точка знания об ошибках клиента. Плагин использует
  её, чтобы решить: при `'auth'` пытаться переаутентифицировать, при `'network'`
  (и включённом `session.keepSessionOnNetworkError`) сохранить сессию и повторить
  рефреш позже, иначе — разлогинить.

Классификация возвращает строку-категорию (а не типизированную ошибку или
`instanceof`) намеренно: сравнение значений не зависит от идентичности классов и
не ломается при дублировании копий модуля в разных бандлах.

### Кастомный адаптер (на примере @hey-api)

Готовый референс экспортируется из пакета — его же удобно взять за образец:

```js
import { createHeyApiAdapter } from '@andrey-aka-skif/jwt-auth-plugin'
import * as sdk from './api/generated'

app.use(auth, {
  router,
  axiosInstance,
  api: createHeyApiAdapter({ sdk, config }),
  config,
})
```

> Точная форма результата/ошибок @hey-api зависит от версии и выбранного клиента
> (fetch/axios). Адаптер — образец: подгоните обращения к полям под свою генерацию.
> Вся клиент-специфичная логика остаётся внутри одного файла адаптера.

## Обработка ошибки входа в UI

`login` бросает сырую ошибку клиента. Чтобы единообразно её истолковать, используйте
публичный `auth.getErrorKind`:

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
