import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { EvaluationCaseDetailOut } from '../../../core/models/case.model';
import { FinacesRiskBadgeComponent } from '../../../shared/components/finaces-risk-badge/finaces-risk-badge.component';

@Component({
  selector: 'app-recent-cases-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    FinacesRiskBadgeComponent,
    DecimalPipe
  ],
  templateUrl: './recent-cases-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .table-container {
      @apply bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] overflow-hidden;
    }
    .mat-mdc-row:hover {
      @apply bg-[var(--color-surface-default)] transition-colors duration-150;
    }
    .avatar-circle {
      @apply w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0;
    }
  `]
})
export class RecentCasesTableComponent {
  readonly cases = input.required<EvaluationCaseDetailOut[]>();
  readonly displayedColumns: string[] = ['reference', 'bidder', 'amount', 'status', 'mcc_class', 'actions'];

  getAvatarColor(name: string): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) ? colors[Math.abs(hash) % colors.length] : colors[0];
  }

  getInitials(name: string): string {
    return name ? name.substring(0, 2).toUpperCase() : 'NA';
  }
}