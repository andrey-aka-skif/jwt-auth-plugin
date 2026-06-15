export const DEFAULT_CONFIG = {
  api: {
    baseURL: 'http://localhost:5000/api/',
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
      // TODO: storage: 'localStorage' | 'memory'
      responseKey: 'access_token',
      requestKey: 'Authorization',
      storageKey: 'auth_access_token',
    },
    refresh: {
      // TODO: storage: 'localStorage' | 'httpOnlyCookie' | 'memory'
      responseKey: 'refresh_token',
      requestKey: 'refresh_token', // 'refresh_token' | 'X-Refresh-Token'
      requestMethod: 'body', // 'body' | 'header'
      storageKey: 'auth_refresh_token',
      checkIntervalMinutes: 1 / 60,
      checkIntervalThresholdMinutes: 59.5 / 60,
      lockKey: 'auth_refresh_lock',
      lockTimeout: 5000,
    },
  },
}
