import { NgClass, DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { IaMonitoringAlert } from '../../../../core/models/ia-admin.model';

@Component({
  selector: 'app-monitoring-alerts',
  standalone: true,
  imports: [NgClass, DatePipe],
  templateUrl: './monitoring-alerts.component.html',
  styleUrls: ['./monitoring-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringAlertsComponent {
  alerts = input<IaMonitoringAlert[]>([]);
}
