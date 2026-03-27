import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div class="h-full flex flex-col items-center justify-center space-y-4">
      <h1 class="text-6xl font-bold text-[var(--color-primary)]">404</h1>
      <p class="text-xl text-[var(--color-content-tertiary)]">La page demandée est introuvable.</p>
      <a routerLink="/dashboard" class="text-[var(--color-primary)] hover:underline">Retour au tableau de bord</a>
    </div>
  `,
  imports: [RouterLink]
})
export class NotFoundComponent {}
