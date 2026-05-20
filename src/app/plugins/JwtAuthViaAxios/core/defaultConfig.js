export const DEFAULT_CONFIG = {
  api: {
    baseURL: 'http://localhost:5000/api/',
  },
  plugin: {
    autoStart: true,
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
      receivingKey: 'access_token',
      storageKey: 'access_token',
      storage: 'localStorage',
      sendingKey: 'Authorization',
    },
    refresh: {
      receivingKey: 'refresh_token',
      storageKey: 'refresh_token',
      storage: 'httpOnlyCookie',
      sendingMethod: 'body', // 'body' or 'header'
      sendingKey: 'refresh_token', // 'refresh_token' for body, 'X-Refresh-Token' for header
    },
  },
}
