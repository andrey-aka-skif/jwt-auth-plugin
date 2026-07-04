# jwt-auth-plugin (монорепозиторий)

Монорепозиторий плагина JWT-аутентификации для Vue 3. Основная документация
плагина — в пакете: [`packages/jwt-auth-plugin/README.md`](packages/jwt-auth-plugin/README.md).

## Структура

- [`packages/jwt-auth-plugin`](packages/jwt-auth-plugin/README.md) — сам плагин
  (публикуемый npm-пакет).
- [`playgrounds/spa`](playgrounds/spa/README.md) — демо на Vue 3 + Vite: запуск,
  генерация SDK из OpenAPI-спеки, пример SDK поверх общего axios-инстанса.
- [`playgrounds/api`](playgrounds/api/README.md) — demo-бэкенд (ASP.NET .NET 9),
  отдаёт OpenAPI-спеку.

## Команды (из корня)

```bash
npm run dev      # запустить playgrounds/spa
npm run build    # собрать плагин
npm run lint     # eslint по всему репо
```

Как запускать плейграунды и как устроена генерация SDK/OpenAPI-спеки — в их README
(ссылки выше).
