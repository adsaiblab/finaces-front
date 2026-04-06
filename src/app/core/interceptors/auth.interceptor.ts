/**
 * auth.interceptor.ts
 *
 * Functional HTTP interceptor (Angular 15+).
 * Attaches the JWT Bearer token to every outbound request targeting
 * the backend API origin. Third-party requests are untouched.
 *
 * Origin is derived once at module load from environment.apiUrl via
 * new URL(...).origin — no extra environment key needed.
 *
 * Skips requests that already carry an Authorization header
 * (e.g. refresh-token calls handled by jwtInterceptor).
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Derived once at module load — e.g. 'http://localhost:8000' */
const apiOrigin = new URL(environment.apiUrl).origin;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (!req.url.startsWith(apiOrigin)) {
    return next(req);
  }

  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
