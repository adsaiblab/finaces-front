import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideAnimations } from '@angular/platform-browser/animations';
import * as Sentry from '@sentry/angular';

import { routes } from './app.routes';
import { jwtInterceptor, xsrfInterceptor } from './core/interceptors';
import { FinacesTitleStrategy } from './core/strategies/finaces-title.strategy';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // Sentry: initialisation via APP_INITIALIZER + ErrorHandler global
    // Guard: si sentryDsn est vide (dev local, CI) — Sentry reste silencieux.
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        if (environment.sentryDsn) {
          Sentry.init({
            dsn: environment.sentryDsn,
            environment: environment.name,
            integrations: [
              Sentry.browserTracingIntegration(),
              Sentry.replayIntegration(),
            ],
            tracesSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0, // Replay uniquement sur erreur
            replaysSessionSampleRate: 0,   // Pas de replay systématique
          });
        }
      },
      multi: true,
    },
    // Remplace le ErrorHandler Angular par Sentry (no-op si DSN absent)
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      // Execution order: jwt (Bearer + 401 logout) → xsrf (XSRF-TOKEN header on mutations)
      withInterceptors([jwtInterceptor, xsrfInterceptor]),
      // Angular reads XSRF-TOKEN cookie set by backend XSRFMiddleware on GET responses
      // and injects X-XSRF-TOKEN header on all mutating requests (POST/PUT/PATCH/DELETE).
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideAnimations(),
    { provide: TitleStrategy, useClass: FinacesTitleStrategy },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
};
