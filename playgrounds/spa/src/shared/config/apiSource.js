// Переключатель источника API в плейграунде:
//   'generated' — сгенерированный @hey-api SDK (src/shared/api/authAdapter),
//   'builtin'   — встроенный axios-адаптер плагина (по умолчанию).
// Управляется переменной окружения VITE_API_SOURCE.
export const API_SOURCE = import.meta.env.VITE_API_SOURCE ?? 'builtin'
