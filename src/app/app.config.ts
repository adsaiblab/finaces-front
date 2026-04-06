import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor, xsrfInterceptor } from './core/interceptors';
import { FinacesTitleStrategy } from './core/strategies/finaces-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
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
