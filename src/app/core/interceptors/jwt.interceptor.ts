import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();
    const isLoginEndpoint = req.url.includes('login');
    
    const authReq = (token && !isLoginEndpoint)
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                authService.logout();
                // logout() in authService now handles router.navigate(['/auth/login']) 
                // but we also can explicitly do it here just in case as requested.
            }
            return throwError(() => error);
        })
    );
};