export const AUTH_CONFIG = {
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL,
  },
  token: {
    access: {
      subKey:
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    },
    refresh: {
      checkIntervalMinutes: 1 / 60,
      checkIntervalThresholdMinutes: 59.3 / 60,
      checkJitterPercent: 0.1,
      raceWaitIntervalMs: 5,
    },
  },
}
