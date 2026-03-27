import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Subject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';

interface JwtPayload {
  exp: number;
  sub: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly TOKEN_KEY = 'finaces_token';
    private readonly router = inject(Router);
    private readonly http = inject(HttpClient);
    readonly logout$ = new Subject<void>();

    login(username: string, password: string): Observable<{ access_token: string }> {
        return this.http.post<{ access_token: string }>(
            `${environment.apiUrl}/auth/token`,
            { username, password }
        ).pipe(
            tap(({ access_token }) => this.setToken(access_token))
        );
    }

    setToken(token: string): void {
        sessionStorage.setItem(this.TOKEN_KEY, token);
    }

    getToken(): string | null {
        return sessionStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = jwtDecode<JwtPayload>(token);
            return payload.exp > Date.now() / 1000;
        } catch {
            return false;
        }
    }

    logout(): void {
        sessionStorage.removeItem(this.TOKEN_KEY);
        this.logout$.next();
        this.router.navigate(['/auth/login']);
    }
}