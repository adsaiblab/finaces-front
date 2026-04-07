import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Injectable } from '@angular/core';

import { routes } from './app.routes';
import { jwtInterceptor, xsrfInterceptor } from './core/interceptors';
import { FinacesTitleStrategy } from './core/strategies/finaces-title.strategy';
import { environment } from '../environments/environment';

// Variable locale pour stocker l'instance Sentry une fois chargée dynamiquement
let sentryRef: any = null;

@Injectable({ providedIn: 'root' })
export class SentryErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (sentryRef) {
      sentryRef.captureException(error);
    }
    console.error(error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Sentry: initialisation via APP_INITIALIZER + ErrorHandler global
    // Guard: si sentryDsn est vide (dev local, CI) — Sentry reste silencieux.
    {
      provide: APP_INITIALIZER,
      useFactory: () => async () => {
        if (!environment.sentryDsn) return;
        const Sentry = await import('@sentry/angular');
        sentryRef = Sentry;
        Sentry.init({
          dsn: environment.sentryDsn,
          environment: environment.name,
          tracesSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
          ],
        });
      },
      multi: true,
    },
    // Remplace le ErrorHandler Angular par notre handler dynamique
    { provide: ErrorHandler, useClass: SentryErrorHandler },
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
