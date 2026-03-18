import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    computed,
    signal
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
export class FinacesRiskBadgeComponent implements OnChanges {
    @Input({ required: true }) riskClass: RiskClass = 'LOW';
    @Input() rail: Rail = 'MCC';
    @Input() size: 'sm' | 'md' = 'md';
    @Input() showLabel: boolean = true;
    @Input() showIcon: boolean = false;

    // Metadata sémantique uniquement (labels + icônes) — ZÉRO couleur
    private readonly metadataMap: Record<RiskClass, RiskMetadata> = {
        LOW:      { label: 'Faible',   icon: 'check_circle' },
        MODERATE: { label: 'Modéré',   icon: 'warning'      },
        HIGH:     { label: 'Élevé',    icon: 'error'        },
        CRITICAL: { label: 'Critique', icon: 'crisis_alert' }
    };

    metadata: RiskMetadata = this.metadataMap.LOW;
    isMcc: boolean = true;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['riskClass'] || changes['rail']) {
            this.metadata = this.metadataMap[this.riskClass] ?? this.metadataMap.LOW;
            this.isMcc = this.rail === 'MCC';
        }
    }

    /**
     * Génère les classes CSS sémantiques.
     * Toutes les couleurs sont définies dans le SCSS via var(--token) → Dark Mode natif.
     * Pattern : badge-{rail}-{risk} (ex: badge-mcc-low, badge-ia-critical)
     */
    get badgeClasses(): string[] {
        const sizeClass = this.size === 'sm' ? 'badge-sm' : 'badge-md';
        const railClass = this.isMcc ? 'badge-mcc' : 'badge-ia';
        const riskClass = `badge-${this.rail.toLowerCase()}-${this.riskClass.toLowerCase()}`;
        return ['finaces-badge', sizeClass, railClass, riskClass];
    }
}
