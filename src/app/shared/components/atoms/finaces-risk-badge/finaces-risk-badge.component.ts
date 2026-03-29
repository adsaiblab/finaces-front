import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

export type RiskClass = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Rail = 'MCC' | 'IA';

interface RiskMetadata {
  label: string;
  icon: string;
}

@Component({
  selector: 'finaces-risk-badge',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './finaces-risk-badge.component.html',
  styleUrls: ['./finaces-risk-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesRiskBadgeComponent {
  readonly riskClass = input<RiskClass>('MODERATE');
  readonly rail = input<Rail>('MCC');
  readonly size = input<'sm' | 'md'>('md');
  readonly showLabel = input<boolean>(true);
  readonly showIcon = input<boolean>(false);

  private readonly metadataMap = {
    LOW: { label: 'Low', icon: 'check_circle' },
    MODERATE: { label: 'Moderate', icon: 'warning' },
    HIGH: { label: 'High', icon: 'error' },
    CRITICAL: { label: 'Critical', icon: 'crisis_alert' },
  } as const satisfies Record<RiskClass, RiskMetadata>;

  readonly metadata = computed<RiskMetadata>(
    () => this.metadataMap[this.riskClass()] ?? this.metadataMap.LOW,
  );

  readonly isMcc = computed<boolean>(() => this.rail() === 'MCC');

  readonly badgeClasses = computed<string[]>(() => {
    const sizeClass = this.size() === 'sm' ? 'badge-sm' : 'badge-md';
    const railClass = this.isMcc() ? 'badge-mcc' : 'badge-ia';
    const safeRiskClass = this.riskClass() ? this.riskClass().toLowerCase() : 'low';
    const riskClassStr = `badge-${this.rail().toLowerCase()}-${safeRiskClass}`;
    return ['finaces-badge', sizeClass, railClass, riskClassStr];
  });
}
