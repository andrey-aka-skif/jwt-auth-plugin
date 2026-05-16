export const DEFAULT_CONFIG = {
  token: {
    access: {
      receivingKey: 'access_token',
      storageKey: 'access_token',
      storage: 'localStorage',
      sendingMethod: 'header',
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
