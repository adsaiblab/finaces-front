import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CaseService } from '../../core/services/case.service';
import {
  DashboardStatsOut,
  ConvergenceChartOut,
  TensionAlertOut,
} from '../../core/models/dashboard.model';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { FinacesSkeletonLoaderComponent } from '../../shared/components/molecules/finaces-skeleton-loader/finaces-skeleton-loader.component';
import { UI_LABELS } from '../../shared/constants/ui-labels';

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
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly caseService = inject(CaseService);
  public UI_LABELS = UI_LABELS;

  readonly stats$: Observable<DashboardStatsOut | null> = this.caseService
    .getDashboardStats()
    .pipe(catchError(() => of(null)));
  readonly recentCases$: Observable<EvaluationCaseDetailOut[]> = this.caseService
    .getRecentCases(5)
    .pipe(catchError(() => of([])));
  readonly tensions$: Observable<TensionAlertOut[]> = this.caseService
    .getActiveTensionCases()
    .pipe(catchError(() => of([])));
  readonly chartData$: Observable<ConvergenceChartOut | null> = this.caseService
    .getConvergenceChart(30)
    .pipe(catchError(() => of(null)));
}
