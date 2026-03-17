import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type RiskClass = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Rail = 'MCC' | 'IA';

interface RiskColorScheme {
    mcc: { bg: string; text: string };
    ia: { bg: string; text: string; border: string };
    label: string;
    icon?: string;
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

    colorScheme: RiskColorScheme | null = null;
    isMcc: boolean = true;

    private readonly colorMap: Record<RiskClass, RiskColorScheme> = {
        LOW: {
            mcc: { bg: '#22C55E', text: '#FFFFFF' },
            ia: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: '#3B82F6' },
            label: 'Faible',
            icon: 'check_circle'
        },
        MODERATE: {
            mcc: { bg: '#F59E0B', text: '#FFFFFF' },
            ia: { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1', border: '#6366F1' },
            label: 'Modéré',
            icon: 'warning'
        },
        HIGH: {
            mcc: { bg: '#F97316', text: '#FFFFFF' },
            ia: { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: '#8B5CF6' },
            label: 'Élevé',
            icon: 'error'
        },
        CRITICAL: {
            mcc: { bg: '#EF4444', text: '#FFFFFF' },
            ia: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7', border: '#A855F7' },
            label: 'Critique',
            icon: 'crisis_alert'
        }
    };

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['riskClass'] || changes['rail']) {
            this.updateColorScheme();
        }
    }

    private updateColorScheme(): void {
        this.colorScheme = this.colorMap[this.riskClass] || this.colorMap.LOW;
        this.isMcc = this.rail === 'MCC';
        this.cdr.markForCheck();
    }

    get badgeClasses(): string {
        const sizeClass = this.size === 'sm' ? 'badge-sm' : 'badge-md';
        const railClass = this.isMcc ? 'badge-mcc' : 'badge-ia';
        return `finaces-badge ${sizeClass} ${railClass}`;
    }

    get badgeStyle(): Record<string, string> {
        if (!this.colorScheme) return {};

        if (this.isMcc) {
            return {
                'background-color': this.colorScheme.mcc.bg,
                color: this.colorScheme.mcc.text
            };
        } else {
            return {
                'background-color': this.colorScheme.ia.bg,
                color: this.colorScheme.ia.text,
                'border-color': this.colorScheme.ia.border
            };
        }
    }
}