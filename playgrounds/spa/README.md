# playgrounds/spa — demo-приложение

Демо плагина [`@andrey-aka-skif/jwt-auth-plugin`](../../packages/jwt-auth-plugin/README.md)
на Vue 3 + Vite: логин/логаут, защита маршрутов, авто-рефреш и работа собственного
SDK (сгенерированного @hey-api) поверх того же axios-инстанса, что и у плагина.

## Запуск

Из корня репозитория:

```bash
npm run dev            # проксирует на этот playground
# либо адресно:
npm run dev -w playgrounds/spa
```

Переменные окружения — в [`.env.example`](.env.example); скопируйте его в `.env`
(сам `.env` в гит не коммитится):

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` — база demo-бэкенда (по умолчанию `http://localhost:5000`).
- `VITE_BASE_URL` / `VITE_ROUTES_BASE` — база dev-сервера и роутера.

## SDK и OpenAPI-спека

Свои (не-auth) запросы приложение делает через **сгенерированный SDK**. Генерирует
его [@hey-api/openapi-ts](https://heyapi.dev) из **закоммиченного снапшота** спеки.
Труба:

```
живой api (:5000)  --spec:pull-->  снапшот swagger.json  --generate-->  SDK
                                   (в гите, diff-able)     (gitignored)
```

- **Снапшот:** `src/shared/api/openApiManifest/swagger.json` — коммитится в гит,
  служит воспроизводимым входом генерации.
- **Сгенерированный SDK:** `src/shared/api/generated/` — в гит **не** коммитится
  (`.gitignore`), пересобирается из снапшота.
- **Конфиг генерации:** [`openapi-ts.config.js`](openapi-ts.config.js).

### Команды

```bash
npm run generate    # SDK из снапшота (без сети). Запускается сам на prepare,
                    # т.е. после npm install — на свежем клоне SDK восстановится.

npm run spec:pull   # обновить снапшот из ЖИВОГО api и перегенерить SDK
```

`spec:pull` тянет спеку с запущенного бэкенда
(`<VITE_API_BASE_URL>/swagger/v1/swagger.json`), перезаписывает снапшот и запускает
`generate`. Значит:

- для `npm run spec:pull` нужен **поднятый** demo-бэкенд (см.
  [`../api/README.md`](../api/README.md));
- URL по умолчанию — `http://localhost:5000`; можно переопределить аргументом:
  `node scripts/pull-spec.mjs http://localhost:5001`.

Это единственный «официальный» способ обновить снапшот — руками файл больше не
сохраняем.

## Как SDK делит axios с плагином

Чтобы на запросы SDK действовали те же auth-интерсепторы (подстановка токена,
рефреш на 401), SDK и плагин используют **один** axios-инстанс. Рабочий пример:

- [`src/shared/api/http/httpTransport.js`](src/shared/api/http/httpTransport.js) —
  создание общего инстанса;
- [`src/shared/api/setup/setupHeyApiClient.js`](src/shared/api/setup/setupHeyApiClient.js) —
  привязка сгенерированного клиента к нему.
