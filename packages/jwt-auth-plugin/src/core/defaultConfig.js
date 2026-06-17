import { REQUIRED } from './utils'

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
  redirect: {
    onNotAuthenticated: { name: 'login' },
  },
  token: {
    access: {
      responseKey: 'access_token',
      requestKey: 'Authorization',
      storageKey: 'auth_access_token',
      subKey: REQUIRED,
    },
    refresh: {
      responseKey: 'refresh_token',
      requestKey: 'refresh_token', // 'refresh_token' | 'X-Refresh-Token'
      requestMethod: 'body', // 'body' | 'header'
      storageKey: 'auth_refresh_token',
      checkIntervalMinutes: 1,
      checkIntervalThresholdMinutes: 5,
      lockKey: 'auth_refresh_lock',
      lockTimeout: 5000,
    },
  },
}
