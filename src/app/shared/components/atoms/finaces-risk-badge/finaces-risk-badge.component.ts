import {
    Component,
    ChangeDetectionStrategy,
    computed,
    input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type RiskClass = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Rail = 'MCC' | 'IA';

interface RiskMetadata {
    label: string;
    icon: string;
    // Pas de couleurs ici — tout est dans le SCSS via var(--token)
}

@Component({
    selector: 'finaces-risk-badge',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './finaces-risk-badge.component.html',
    styleUrls: ['./finaces-risk-badge.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesRiskBadgeComponent {
    readonly riskClass = input<RiskClass>('MODERATE');
    readonly rail = input<Rail>('MCC');
    readonly size = input<'sm' | 'md'>('md');
    readonly showLabel = input<boolean>(true);
    readonly showIcon = input<boolean>(false);

    // Metadata sémantique uniquement (labels + icônes) — ZÉRO couleur
    private readonly metadataMap: Record<RiskClass, RiskMetadata> = {
        LOW: { label: 'Low', icon: 'check_circle' },
        MODERATE: { label: 'Moderate', icon: 'warning' },
        HIGH: { label: 'High', icon: 'error' },
        CRITICAL: { label: 'Critical', icon: 'crisis_alert' }
    };

    readonly metadata = computed<RiskMetadata>(() =>
        this.metadataMap[this.riskClass()] ?? this.metadataMap.LOW
    );

    readonly isMcc = computed<boolean>(() => this.rail() === 'MCC');

    /**
     * Calcule les classes CSS sémantiques de façon réactive via computed().
     * Toutes les couleurs sont définies dans le SCSS via var(--token) → Dark Mode natif.
     * Pattern : badge-{rail}-{risk} (ex: badge-mcc-low, badge-ia-critical)
     */
    readonly badgeClasses = computed<string[]>(() => {
        const sizeClass = this.size() === 'sm' ? 'badge-sm' : 'badge-md';
        const railClass = this.isMcc() ? 'badge-mcc' : 'badge-ia';
        const safeRiskClass = this.riskClass() ? this.riskClass().toLowerCase() : 'low';
        const riskClassStr = `badge-${this.rail().toLowerCase()}-${safeRiskClass}`;
        return ['finaces-badge', sizeClass, railClass, riskClassStr];
    });
}
