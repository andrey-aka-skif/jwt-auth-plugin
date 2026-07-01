import { REQUIRED } from '../shared/symbols'
import { STRINGS } from '../shared/strings'

export const DEFAULT_CONFIG = {
  api: {
    baseURL: REQUIRED,
  },
  storage: {
    namespace: STRINGS.name, // STRINGS.name | '' | null
    accessTokenKey: 'access-token',
    refreshTokenKey: 'refresh-token',
  },
  plugin: {
    autoStart: true,
    autoRefresh: true,
  },
  endpoints: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    userinfo: '/api/auth/userinfo',
  },
  session: {
    userSource: 'claims', // 'claims' | 'endpoint'
    keepSessionOnNetworkError: true,
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
