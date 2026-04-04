import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type EmptyStateVariant = 'no-items' | 'no-data' | 'search';

const DEFAULT_ICONS: Record<EmptyStateVariant, string> = {
  'no-items': 'inbox',
  'no-data':  'calculate',
  'search':   'search_off',
};

@Component({
  selector: 'finaces-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './finaces-empty-state.component.html',
  styleUrls: ['./finaces-empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesEmptyStateComponent {
  // Existing inputs — kept as-is for backward compatibility
  readonly icon        = input<string>('');
  readonly title       = input<string>('Aucune donnée');
  readonly description = input<string>('Il n’y a rien à afficher ici pour le moment.');
  readonly ctaText     = input<string>('');
  readonly ctaColor    = input<'primary' | 'accent' | 'warn'>('primary');

  // New inputs (Phase 2 Point 3)
  readonly variant = input<EmptyStateVariant>('no-items');
  readonly testId  = input<string>('');

  readonly ctaClick = output<void>();

  // Resolved icon: explicit input wins, otherwise use variant default
  readonly resolvedIcon = computed<string>(
    () => this.icon() || DEFAULT_ICONS[this.variant()] || 'inbox',
  );

  onAction(): void {
    this.ctaClick.emit();
  }
}
