import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ErrorCode = 'server' | 'timeout' | 'unauthorized' | 'not-found' | 'generic';

const ERROR_META: Record<ErrorCode, { title: string; message: string; icon: string }> = {
  server: {
    title: 'Erreur serveur',
    message: 'Une erreur interne est survenue. Nos équipes ont été notifiées. Veuillez réessayer dans quelques instants.',
    icon: 'cloud_off',
  },
  timeout: {
    title: 'Délai dépassé',
    message: 'Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez.',
    icon: 'timer_off',
  },
  unauthorized: {
    title: 'Session expirée',
    message: 'Votre session a expiré. Vous allez être redirigé vers la page de connexion.',
    icon: 'lock_clock',
  },
  'not-found': {
    title: 'Ressource introuvable',
    message: 'L\'identifiant fourni ne correspond à aucun dossier existant.',
    icon: 'search_off',
  },
  generic: {
    title: 'Erreur de chargement',
    message: 'Impossible de charger les données de cette section. Veuillez réessayer.',
    icon: 'error_outline',
  },
};

@Component({
  selector: 'finaces-inline-error',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './finaces-inline-error.component.html',
  styleUrls: ['./finaces-inline-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesInlineErrorComponent {
  // Existing inputs — kept for backward compatibility
  readonly message    = input<string>('');
  readonly retryCount = input<number>(0);
  readonly maxRetries = input<number>(3);

  // New inputs (Phase 2 Point 3)
  readonly errorCode = input<ErrorCode>('generic');
  readonly testId    = input<string>('');

  readonly retry  = output<void>();
  readonly ignore = output<void>();

  // Resolved metadata: explicit message wins, otherwise use errorCode defaults
  readonly resolvedMeta = computed(() => ERROR_META[this.errorCode()] ?? ERROR_META['generic']);
  readonly resolvedTitle   = computed(() => this.resolvedMeta().title);
  readonly resolvedMessage = computed(() => this.message() || this.resolvedMeta().message);
  readonly resolvedIcon    = computed(() => this.resolvedMeta().icon);

  readonly canRetry = computed(() => this.retryCount() < this.maxRetries());

  onRetry(): void {
    if (this.canRetry()) {
      this.retry.emit();
    }
  }

  onIgnore(): void {
    this.ignore.emit();
  }
}
