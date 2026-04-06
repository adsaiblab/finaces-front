/**
 * xsrf.interceptor.ts
 *
 * Functional HTTP interceptor (Angular 15+).
 * Reads the XSRF-TOKEN cookie set by the backend XSRFMiddleware on every GET
 * response, and injects it as X-XSRF-TOKEN header on every mutation.
 *
 * Safe methods (GET, HEAD, OPTIONS) are passed through untouched.
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getCookie(name: string): string | null {
  const match = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export const xsrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (!MUTATION_METHODS.has(req.method)) {
    return next(req);
  }

  const token = getCookie('XSRF-TOKEN');
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { 'X-XSRF-TOKEN': token } })
  );
};
