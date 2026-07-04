// Тянет OpenAPI-спеку с запущенного demo-api и перезаписывает закоммиченный
// снапшот, из которого openapi-ts генерит SDK. Это единственный «официальный»
// способ обновить снапшот: провенанс api → снапшот больше не ручной.
//
// Обычно запускается через `npm run spec:pull` (см. package.json), который следом
// зовёт `npm run generate`. Можно и напрямую: `node scripts/pull-spec.mjs [baseURL]`.
//
// Источник URL (по убыванию приоритета):
//   1. аргумент командной строки (базовый URL api),
//   2. переменная окружения VITE_API_BASE_URL,
//   3. дефолт http://localhost:5000 (совпадает с .env.example).

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import prettier from 'prettier'

// Маршрут спеки по умолчанию для Swashbuckle (см. playgrounds/api).
const SPEC_PATH = '/swagger/v1/swagger.json'

const DEFAULT_BASE_URL = 'http://localhost:5000'

const baseUrl = (
  process.argv[2] ||
  process.env.VITE_API_BASE_URL ||
  DEFAULT_BASE_URL
).replace(/\/+$/, '')

const specUrl = baseUrl + SPEC_PATH

// Целевой файл резолвим относительно скрипта, а не cwd — чтобы работало и при
// запуске из корня репозитория, и через `npm run ... -w playgrounds/spa`.
const scriptDir = dirname(fileURLToPath(import.meta.url))
const targetPath = resolve(
  scriptDir,
  '../src/shared/api/openApiManifest/swagger.json'
)

const fail = (message) => {
  console.error(`\n[pull-spec] ${message}`)
  process.exit(1)
}

console.log(`[pull-spec] источник: ${specUrl}`)

let response
try {
  response = await fetch(specUrl)
} catch (error) {
  fail(
    `не удалось подключиться к api (${specUrl}).\n` +
      `Поднимите бэкенд: dotnet run --project playgrounds/api/src/JwtAuth.Api\n` +
      `Причина: ${error.message}`
  )
}

if (!response.ok) {
  fail(`api ответил ${response.status} ${response.statusText} на ${specUrl}`)
}

let spec
try {
  spec = await response.json()
} catch (error) {
  fail(`ответ не является валидным JSON: ${error.message}`)
}

// Форматируем через Prettier с конфигом репо, чтобы снапшот совпадал по стилю с
// остальным src и повторные spec:pull давали минимальный дифф. Важно подавать
// Prettier уже отступованный JSON (indent 2): Prettier сохраняет объекты
// многострочными по переносу после `{`, но короткие массивы всё равно сжимает —
// ровно как в исходном снапшоте. Минифицированный вход схлопнул бы и объекты.
const prettierConfig = await prettier.resolveConfig(targetPath)
const formatted = await prettier.format(JSON.stringify(spec, null, 2), {
  ...prettierConfig,
  parser: 'json',
})

writeFileSync(targetPath, formatted)

console.log(`[pull-spec] снапшот обновлён и отформатирован: ${targetPath}`)
