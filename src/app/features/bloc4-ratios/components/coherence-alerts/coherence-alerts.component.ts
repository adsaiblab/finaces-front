import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { CoherenceAlert } from '../../../../core/models/ratio.model';

@Component({
  selector: 'app-coherence-alerts',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatExpansionModule, NgClass],
  templateUrl: './coherence-alerts.component.html',
  styleUrls: ['./coherence-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoherenceAlertsComponent {
  public alerts = input<CoherenceAlert[]>([]);
  public status = input<'CLEAN' | 'WARNINGS' | 'CRITICAL'>('CLEAN');

  public getStatusIcon(): string {
    const st = this.status();
    if (st === 'CRITICAL') return 'error';
    if (st === 'WARNINGS') return 'warning';
    return 'check_circle';
  }

  public getStatusColorClass(): string {
    const st = this.status();
    if (st === 'CRITICAL') return 'text-[color:var(--color-error)]';
    if (st === 'WARNINGS') return 'text-[color:var(--color-warning)]';
    return 'text-[color:var(--color-success)]';
  }

  public getAlertIcon(severity: string): string {
    return severity === 'CRITICAL' ? 'priority_high' : 'warning_amber';
  }
}
