import { inject, isDevMode } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  // TODO: retirer la condition isDevMode() une fois le backend connecté
  if (isDevMode()) return true;

  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/auth/login']);
};
