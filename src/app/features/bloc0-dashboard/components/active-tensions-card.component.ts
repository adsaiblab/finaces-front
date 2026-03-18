import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TensionAlertOut } from '../../../core/models/dashboard.model';
import { FinacesTensionBadgeComponent } from '../../../shared/components/finaces-tension-badge/finaces-tension-badge.component';

@Component({
    selector: 'app-active-tensions-card',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        RouterLink,
        FinacesTensionBadgeComponent
    ],
    templateUrl: './active-tensions-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
    .tensions-container {
      @apply bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] overflow-hidden h-full flex flex-col;
    }
    .tension-list {
      @apply flex-1 overflow-y-auto p-4 flex flex-col gap-3;
      max-height: 400px;
    }
    .tension-item {
      @apply p-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-default)] transition-colors hover:border-[var(--color-warning)] hover:bg-[var(--color-surface-card)];
    }
  `]
})
export class ActiveTensionsCardComponent {
    readonly tensions = input.required<TensionAlertOut[]>();
}