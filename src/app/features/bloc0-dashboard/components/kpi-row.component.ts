import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink } from '@angular/router';
import { DashboardStatsOut } from '../../../core/models/dashboard.model';

@Component({
    selector: 'app-kpi-row',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatBadgeModule, RouterLink],
    templateUrl: './kpi-row.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
    .kpi-card {
      @apply bg-[var(--color-surface-card)] text-[var(--color-content-primary)] shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer h-full rounded-xl border border-[var(--color-border-default)];
    }
    .kpi-mcc-border { border-left: 4px solid var(--color-primary); }
    .kpi-ia-border { border-left: 4px solid var(--color-info); }
    .kpi-warning-border { border-left: 4px solid var(--color-warning); }
  `]
})
export class KpiRowComponent {
    // Utilisation des Signal Inputs (Angular 17+)
    readonly stats = input.required<DashboardStatsOut | null>();
}