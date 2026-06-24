import { REQUIRED } from '../shared/symbols'

export const DEFAULT_CONFIG = {
  api: {
    baseURL: REQUIRED,
  },
  plugin: {
    autoStart: true,
    autoRefresh: true,
  },
  endpoints: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    register: '/auth/register',
    me: '/auth/me',
  },
  session: {
    // Сохранять сессию при сетевой ошибке рефреша (opt-in). По умолчанию
    // false — прежнее поведение: рвём сессию при любом сбое рефреша.
    keepSessionOnNetworkError: false,
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
      storageKey: 'access-token',
      subKey: REQUIRED,
    },
    refresh: {
      responseKey: 'refresh_token',
      requestKey: 'refresh_token', // 'refresh_token' | 'X-Refresh-Token'
      requestMethod: 'body', // 'body' | 'header'
      storageKey: 'auth_refresh_token',
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
