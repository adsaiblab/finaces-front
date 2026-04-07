export const environment = {
  production: false,
  name: 'development',
  apiUrl: 'http://localhost:8000/api/v1',
  authUrl: 'http://localhost:8000',
  apiTimeout: 30000, // ms
  logLevel: 'debug',
  sentryDsn: '', // Sentry silencieux en local
  features: {
    mockData: false,
    debugMode: true,
    analyticsEnabled: false,
  },
};
