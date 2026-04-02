import { PercentPipe, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ConvergenceDataPoint, IaDashboardData } from '../../../../core/models/ia-admin.model';
import { FinacesConvergenceChartComponent } from '../../../../shared/components/organisms/finaces-convergence-chart/finaces-convergence-chart.component';

@Component({
  selector: 'app-performance-metrics',
  standalone: true,
  imports: [MatTabsModule, PercentPipe, DecimalPipe, FinacesConvergenceChartComponent],
  templateUrl: './performance-metrics.component.html',
  styleUrls: ['./performance-metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceMetricsComponent {
  metrics = input<IaDashboardData['global_metrics'] | null>(null);
  convergenceData = input<ConvergenceDataPoint[]>([]);
}
