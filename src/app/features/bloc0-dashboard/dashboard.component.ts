import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { CaseService } from '../../core/services/case.service';
import {
  DashboardStatsOut,
  ConvergenceChartOut,
  TensionAlertOut,
} from '../../core/models/dashboard.model';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { UI_LABELS } from '../../shared/constants/ui-labels';

import {
  FinacesSkeletonLoaderComponent,
  FinacesInlineErrorComponent,
  FinacesEmptyStateComponent,
  ErrorCode,
} from '../../shared/components';

import { KpiRowComponent } from './components/kpi-row/kpi-row.component';
import { RecentCasesTableComponent } from './components/recent-cases-table/recent-cases-table.component';
import { ActiveTensionsCardComponent } from './components/active-tensions-card/active-tensions-card.component';
import { ConvergenceChartComponent } from './components/convergence-chart/convergence-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    KpiRowComponent,
    RecentCasesTableComponent,
    ActiveTensionsCardComponent,
    ConvergenceChartComponent,
    FinacesSkeletonLoaderComponent,
    FinacesInlineErrorComponent,
    FinacesEmptyStateComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly caseService = inject(CaseService);
  readonly UI_LABELS = UI_LABELS;

  // ─── Error state signals ─────────────────────────────────────────────
  readonly statsError   = signal<ErrorCode | null>(null);
  readonly casesError   = signal<ErrorCode | null>(null);
  readonly tensionsError = signal<ErrorCode | null>(null);
  readonly chartError   = signal<ErrorCode | null>(null);

  // ─── Retry counter signals (pour FinacesInlineErrorComponent) ─────────────
  readonly statsRetryCount    = signal<number>(0);
  readonly casesRetryCount    = signal<number>(0);
  readonly tensionsRetryCount = signal<number>(0);
  readonly chartRetryCount    = signal<number>(0);

  // ─── Data streams ─────────────────────────────────────────────────
  readonly stats$: Observable<DashboardStatsOut | null> = this.caseService
    .getDashboardStats()
    .pipe(
      tap(() => this.statsError.set(null)),
      catchError(() => {
        this.statsError.set('server');
        return of(null);
      }),
    );

  readonly recentCases$: Observable<EvaluationCaseDetailOut[]> = this.caseService
    .getRecentCases(5)
    .pipe(
      tap(() => this.casesError.set(null)),
      catchError(() => {
        this.casesError.set('server');
        return of([]);
      }),
    );

  readonly tensions$: Observable<TensionAlertOut[]> = this.caseService
    .getActiveTensionCases()
    .pipe(
      tap(() => this.tensionsError.set(null)),
      catchError(() => {
        this.tensionsError.set('server');
        return of([]);
      }),
    );

  readonly chartData$: Observable<ConvergenceChartOut | null> = this.caseService
    .getConvergenceChart(30)
    .pipe(
      tap(() => this.chartError.set(null)),
      catchError(() => {
        this.chartError.set('server');
        return of(null);
      }),
    );

  // ─── Retry handlers ───────────────────────────────────────────────
  // Note: un vrai retry nécessite une logique de re-subscription.
  // Ces handlers incrémentent le compteur pour le composant InlineError
  // et réinitialisent le signal d'erreur pour déclencher un nouveau rendu.
  onRetryStats():    void { this.statsRetryCount.update(n => n + 1);    this.statsError.set(null); }
  onRetryCases():    void { this.casesRetryCount.update(n => n + 1);    this.casesError.set(null); }
  onRetryTensions(): void { this.tensionsRetryCount.update(n => n + 1); this.tensionsError.set(null); }
  onRetryChart():    void { this.chartRetryCount.update(n => n + 1);    this.chartError.set(null); }
}
