# playgrounds/api — demo-бэкенд аутентификации

Демонстрационный бэкенд JWT-аутентификации для плагина: ASP.NET (.NET 9, minimal
API), хранилище **in-memory** (без БД). Обслуживает `login` / `refresh` / `logout`
/ `userinfo`, проверяет токены и — что важно для монорепо — отдаёт OpenAPI-спеку, из
которой `playgrounds/spa` генерит SDK.

> Токены намеренно короткоживущие (access — 60 c, refresh — 2 мин), чтобы удобно было
> наблюдать авто-рефреш и межвкладочную синхронизацию. CORS предзаконфигурен на
> dev-origin spa (`http://localhost:5173`).

## Запуск

Нужен .NET SDK 9. Из каталога `playgrounds/api`:

```bash
dotnet run --project src/JwtAuth.Api
```

Или откройте `JwtAuth.Api.sln` в IDE и запустите профиль `http`/`https`.

- профиль `http` → `http://localhost:5000`
- профиль `https` → `https://localhost:5001`

## OpenAPI-спека (источник снапшота для spa)

Swagger включён **только в Development**:

- UI: `http://localhost:5000/swagger`
- JSON-спека: **`http://localhost:5000/swagger/v1/swagger.json`**

Именно этот JSON — источник снапшота, из которого spa генерит SDK. Обновляется он не
руками, а скриптом `npm run spec:pull` со стороны spa (тянет спеку с запущенного
бэкенда) — подробности в [`../spa/README.md`](../spa/README.md).

## Нужен ли бэкенд для демо?

Для базового просмотра spa — **нет**: SDK там генерится из закоммиченного снапшота
спеки, spa поднимается без бэкенда. Бэкенд нужен, когда хочется настоящих запросов
(логин, рефреш и т. п.) или чтобы **обновить снапшот** через `spec:pull`.
