import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { CaseService } from '../../core/services/case.service';
import { DashboardStatsOut, ConvergenceChartOut, TensionAlertOut } from '../../core/models/dashboard.model';
import { Case } from '../../core/models/case.model';

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

    // Observables gérés proprement via le pipe async (pas de memory leak)
    readonly stats$: Observable<DashboardStatsOut> = this.caseService.getDashboardStats();
    readonly recentCases$: Observable<Case[]> = this.caseService.getRecentCases(5) as unknown as Observable<Case[]>;
    readonly tensions$: Observable<TensionAlertOut[]> = this.caseService.getActiveTensionCases() as unknown as Observable<TensionAlertOut[]>;
    readonly chartData$: Observable<ConvergenceChartOut> = this.caseService.getConvergenceChart(30);
}