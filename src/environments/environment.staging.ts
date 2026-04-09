export const environment = {
  production: false,
  name: 'staging',
  apiUrl: 'https://staging.adsa.cloud/api/v1',
  authUrl: 'https://staging.adsa.cloud',
  apiTimeout: 30000, // ms
  logLevel: 'warn',
  sentryDsn: '', // Remplacer par le DSN staging Sentry avant le build
  features: {
    mockData: false,
    debugMode: true,
    analyticsEnabled: false,
  },
};
