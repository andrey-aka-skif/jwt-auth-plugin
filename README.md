# jwt-auth-plugin (монорепо)

Монорепо плагина JWT-аутентификации для Vue 3. Основная документация плагина —
в пакете: [`packages/jwt-auth-plugin/README.md`](packages/jwt-auth-plugin/README.md).

## Структура

- `packages/jwt-auth-plugin` — сам плагин (публикуемый npm-пакет).
- `playgrounds/spa` — демо-приложение на Vue 3 + Vite (в т. ч. пример работы со
  сгенерированным @hey-api SDK поверх общего axios-инстанса).
- `playgrounds/api` — бэкенд для демо (ASP.NET, выдаёт OpenAPI-спеку).

## Команды (из корня)

```bash
npm run dev      # запустить playgrounds/spa
npm run build    # собрать плагин
npm run lint     # eslint по всему репо
```

SDK в `playgrounds/spa` генерируется из снапшота спеки
(`src/shared/api/openApiManifest/swagger.json`) и в гит не коммитится:

```bash
npm run generate -w playgrounds/spa   # пересобрать SDK из снапшота
```

Скрипт `prepare` в `playgrounds/spa` запускает генерацию автоматически после
`npm install` — на свежем клоне SDK восстанавливается сам.
