import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-rapport-metrics',
  standalone: true,
  imports: [],
  templateUrl: './rapport-metrics.component.html',
  styleUrls: ['./rapport-metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportMetricsComponent {
  label = input<string>('Metric Name');
  value = input<string | number>('N/A');
  trend = input<'up' | 'down' | 'flat'>('flat');
}
