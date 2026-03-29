import { PercentPipe, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-performance-metrics',
  standalone: true,
  imports: [MatTabsModule, PercentPipe, DecimalPipe],
  templateUrl: './performance-metrics.component.html',
  styleUrls: ['./performance-metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceMetricsComponent {
  metrics = input<any>({});
}
