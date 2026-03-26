import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'app-performance-metrics',
    standalone: true,
    imports: [CommonModule, MatTabsModule],
    templateUrl: './performance-metrics.component.html',
    styleUrls: ['./performance-metrics.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceMetricsComponent {
    metrics = input<any>({});
}