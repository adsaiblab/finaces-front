import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { CaseService } from '../../core/services/case.service';
import { DashboardStatsOut, ConvergenceChartOut, TensionAlertOut } from '../../core/models/dashboard.model';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';

import { KpiRowComponent } from './components/kpi-row.component';
import { RecentCasesTableComponent } from './components/recent-cases-table.component';
import { ActiveTensionsCardComponent } from './components/active-tensions-card.component';
import { ConvergenceChartComponent } from './components/convergence-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    KpiRowComponent,
    RecentCasesTableComponent,
    ActiveTensionsCardComponent,
    ConvergenceChartComponent
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly caseService = inject(CaseService);

  readonly stats$: Observable<DashboardStatsOut> = this.caseService.getDashboardStats();
  readonly recentCases$: Observable<EvaluationCaseDetailOut[]> = this.caseService.getRecentCases(5);
  readonly tensions$: Observable<TensionAlertOut[]> = this.caseService.getActiveTensionCases();
  readonly chartData$: Observable<ConvergenceChartOut> = this.caseService.getConvergenceChart(30);
}