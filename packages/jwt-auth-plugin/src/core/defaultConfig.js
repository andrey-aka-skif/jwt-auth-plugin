import { REQUIRED } from '../shared/symbols'
import { STRINGS } from '../shared/strings'

export const DEFAULT_CONFIG = {
  api: {
    baseURL: REQUIRED,
  },
  storage: {
    // Префикс ключей localStorage — изолирует токены этого инстанса плагина.
    // Пустая строка / null отключают префикс (ключи используются как есть).
    namespace: STRINGS.name,
    // Ключи localStorage, под которыми хранится пара токенов.
    accessTokenKey: 'access-token',
    refreshTokenKey: 'auth_refresh_token',
  },
  plugin: {
    autoStart: true,
    autoRefresh: true,
  },
  endpoints: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    me: '/api/auth/me',
  },
  session: {
    // Сохранять сессию при сетевой ошибке рефреша (opt-in). По умолчанию
    // true: не рвём сессию при любом сбое рефреша.
    keepSessionOnNetworkError: true,
    // Статусы ответа, при которых сессия считается невалидной → разлогин.
    logoutStatuses: [401],
  },
  redirect: {
    backToPreviousOnAuthenticated: {
      enabled: true,
      queryKey: 'redirect',
    },
    onNotAuthenticated: { name: 'login' },
  },
  token: {
    access: {
      responseKey: 'access_token',
      requestKey: 'Authorization',
      subKey: REQUIRED,
    },
    refresh: {
      responseKey: 'refresh_token',
      requestKey: 'refresh_token', // 'refresh_token' | 'X-Refresh-Token'
      requestMethod: 'body', // 'body' | 'header'
      checkIntervalMinutes: 1,
      checkIntervalThresholdMinutes: 5,
      checkJitterPercent: 0.1,
      lockKey: 'refresh-lock',
      lockTimeout: 5000,
      raceWaitIntervalMs: 100,
      raceWaitMaxAttempts: 5,
    },
  },
}
