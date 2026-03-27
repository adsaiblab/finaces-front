import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const uuidGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const id = route.paramMap.get('id');

  // Regex basique pour un UUID (v4 en général)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (id && uuidRegex.test(id)) {
    return true;
  }

  // Redirection si ce n'est pas un UUID valide (par exemple 'new' devrait être attrapé avant, ou toute autre chaîne invalide)
  return router.parseUrl('/dashboard');
};
