import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class DashboardComponent implements OnInit {
  private readonly caseService = inject(CaseService);
  private readonly destroyRef = inject(DestroyRef);
  readonly UI_LABELS = UI_LABELS;

  // ─── Loading signals (granulaires — 1 par stream) ────────────────────
  readonly isKpiLoading      = signal<boolean>(true);
  readonly isCasesLoading    = signal<boolean>(true);
  readonly isTensionsLoading = signal<boolean>(true);
  readonly isChartLoading    = signal<boolean>(true);

  // ─── Error state signals ─────────────────────────────────────────────
  readonly statsError    = signal<ErrorCode | null>(null);
  readonly casesError    = signal<ErrorCode | null>(null);
  readonly tensionsError = signal<ErrorCode | null>(null);
  readonly chartError    = signal<ErrorCode | null>(null);

  // ─── Retry counter signals ────────────────────────────────────────────
  readonly statsRetryCount    = signal<number>(0);
  readonly casesRetryCount    = signal<number>(0);
  readonly tensionsRetryCount = signal<number>(0);
  readonly chartRetryCount    = signal<number>(0);

  // ─── Computed : tensions empty-state ─────────────────────────────────
  // true quand le stream a répondu, sans erreur, et sans données
  readonly tensionsLoaded = signal<TensionAlertOut[]>([]);
  readonly hasTensionsData = computed(
    () => !this.isTensionsLoading() && !this.tensionsError() && this.tensionsLoaded().length > 0,
  );
  readonly tensionsEmpty = computed(
    () => !this.isTensionsLoading() && !this.tensionsError() && this.tensionsLoaded().length === 0,
  );

  // ─── Data Signals ───────────────────────────────────────────────────────
  readonly statsData = signal<DashboardStatsOut | null>(null);
  readonly recentCasesData = signal<EvaluationCaseDetailOut[]>([]);
  readonly chartDataLoaded = signal<ConvergenceChartOut | null>(null);

  ngOnInit(): void {
    this.caseService
      .getDashboardStats()
      .pipe(
        tap((data) => {
          this.statsData.set(data);
          this.statsError.set(null);
          this.isKpiLoading.set(false);
        }),
        catchError(() => {
          this.statsError.set('server');
          this.isKpiLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.caseService
      .getRecentCases(5)
      .pipe(
        tap((data) => {
          this.recentCasesData.set(data);
          this.casesError.set(null);
          this.isCasesLoading.set(false);
        }),
        catchError(() => {
          this.casesError.set('server');
          this.isCasesLoading.set(false);
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.caseService
      .getActiveTensionCases()
      .pipe(
        tap((data) => {
          this.tensionsError.set(null);
          this.isTensionsLoading.set(false);
          this.tensionsLoaded.set(data);
        }),
        catchError(() => {
          this.tensionsError.set('server');
          this.isTensionsLoading.set(false);
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.caseService
      .getConvergenceChart(30)
      .pipe(
        tap((data) => {
          this.chartDataLoaded.set(data);
          this.chartError.set(null);
          this.isChartLoading.set(false);
        }),
        catchError(() => {
          this.chartError.set('server');
          this.isChartLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // ─── Retry handlers ───────────────────────────────────────────────────
  onRetryStats(): void {
    this.statsRetryCount.update((n) => n + 1);
    this.statsError.set(null);
  }
  onRetryCases(): void {
    this.casesRetryCount.update((n) => n + 1);
    this.casesError.set(null);
  }
  onRetryTensions(): void {
    this.tensionsRetryCount.update((n) => n + 1);
    this.tensionsError.set(null);
  }
  onRetryChart(): void {
    this.chartRetryCount.update((n) => n + 1);
    this.chartError.set(null);
  }
}
