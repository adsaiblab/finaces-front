import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Subject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';

interface JwtPayload {
  exp: number;
  sub: string;
  /** Champs optionnels selon le back — on accepte ce qui vient */
  username?: string;
  name?: string;
  role?: string;
}

export interface CurrentUser {
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'finaces_token';
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly logout$ = new Subject<void>();

  /** Signal lu directement dans le template — pas de subscribe manuel. */
  readonly currentUser = signal<CurrentUser | null>(null);

  login(username: string, password: string): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/token`, { username, password })
      .pipe(tap(({ access_token }) => this.setToken(access_token)));
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this._refreshCurrentUser(token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      const valid = payload.exp > Date.now() / 1000;
      if (valid && !this.currentUser()) {
        this._refreshCurrentUser(token);
      }
      return valid;
    } catch {
      return false;
    }
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.logout$.next();
    this.router.navigate(['/auth/login']);
  }

  private _refreshCurrentUser(token: string): void {
    try {
      const p = jwtDecode<JwtPayload>(token);
      this.currentUser.set({
        username: p.username ?? p.name ?? p.sub ?? 'Utilisateur',
        role: p.role ?? 'Analyste',
      });
    } catch {
      this.currentUser.set(null);
    }
  }
}
