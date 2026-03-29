import { NgClass } from '@angular/common';
import { 
    Component,
    ChangeDetectionStrategy,
    computed,
    input
, Input } from "@angular/core";

import { MatIconModule } from '@angular/material/icon';

export type RiskClass = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Rail = 'MCC' | 'IA';

interface RiskMetadata {
    @Input() label = input<RiskClass>('MODERATE');
    @Input() rail = input<Rail>('MCC');
    @Input() size = input<'sm' | 'md'>('md');
    @Input() showLabel = input<boolean>(true);
    @Input() showIcon = input<boolean>(false);

    private readonly metadataMap = {
        LOW: { label: 'Low', icon: 'check_circle' },
        MODERATE: { label: 'Moderate', icon: 'warning' },
        HIGH: { label: 'High', icon: 'error' },
        CRITICAL: { label: 'Critical', icon: 'crisis_alert' }
    } as const satisfies Record<RiskClass, RiskMetadata>;

    readonly metadata = computed<RiskMetadata>(() =>
        this.metadataMap[this.riskClass()] ?? this.metadataMap.LOW
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

