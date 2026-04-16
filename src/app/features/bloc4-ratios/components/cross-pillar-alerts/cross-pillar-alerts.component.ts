import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CoherenceAlert } from '../../../../core/models/ratio.model';

@Component({
  selector: 'app-cross-pillar-alerts',
  standalone: true,
  imports: [MatCardModule, MatIconModule, NgClass],
  templateUrl: './cross-pillar-alerts.component.html',
  styleUrls: ['./cross-pillar-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrossPillarAlertsComponent {
  public alerts = input<CoherenceAlert[]>([]);

  public getSeverityClass(severity: string): string {
    return severity === 'CRITICAL' ? 'border-critical' : 'border-warning';
  }

  public getSeverityBgClass(severity: string): string {
    return severity === 'CRITICAL' ? 'bg-critical' : 'bg-warning';
  }

  public getBadgeClass(severity: string): string {
    return severity === 'CRITICAL' ? 'bg-critical' : 'bg-warning';
  }

  public getSeverityIconColor(severity: string): string {
    return severity === 'CRITICAL' ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-warning)]';
  }

  public getAlertIcon(ruleId: string): string {
    switch (ruleId) {
      case 'FALSE_LIQUIDITY': return 'water_drop';
      case 'HIDDEN_OVERLEVERAGE': return 'layers';
      case 'TOXIC_WCR': return 'trending_down';
      case 'SCISSORS_EFFECT': return 'content_cut';
      default: return 'info';
    }
  }
}
