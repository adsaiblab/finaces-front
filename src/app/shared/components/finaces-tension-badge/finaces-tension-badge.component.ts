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

export type TensionLevel = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
export type Direction = 'UP' | 'DOWN';

interface TensionScheme {
    icon: string;
    labelFr: string;
    colorClass: string;
}

@Component({
    selector: 'finaces-tension-badge',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './finaces-tension-badge.component.html',
    styleUrls: ['./finaces-tension-badge.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesTensionBadgeComponent implements OnChanges {
    @Input({ required: true }) level: TensionLevel = 'NONE';
    @Input() direction?: Direction;
    @Input() delta?: number;
    @Input() size: 'sm' | 'md' = 'md';

    tensionScheme: TensionScheme = { icon: 'check_circle', labelFr: 'Convergence', colorClass: 'tension-none' };
    displayDelta: string = '';
    directionIcon: string = '';

    private readonly schemeMap: Record<TensionLevel, TensionScheme> = {
        NONE: { icon: 'check_circle', labelFr: 'Convergence', colorClass: 'tension-none' },
        MILD: { icon: 'info', labelFr: 'Tension légère', colorClass: 'tension-mild' },
        MODERATE: { icon: 'warning', labelFr: 'Tension modérée', colorClass: 'tension-moderate' },
        SEVERE: { icon: 'crisis_alert', labelFr: 'TENSION MAJEURE', colorClass: 'tension-severe' }
    };

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['level'] || changes['direction'] || changes['delta']) {
            this.updateScheme();
        }
    }

    private updateScheme(): void {
        this.tensionScheme = this.schemeMap[this.level] || this.schemeMap.NONE;

        if (this.delta !== undefined && this.delta !== null) {
            const sign = this.delta > 0 ? '+' : '';
            this.displayDelta = `${sign}${this.delta.toFixed(2)}`;
        }

        this.directionIcon = this.direction === 'UP' ? 'trending_up' : 'trending_down';
        this.cdr.markForCheck();
    }

    get badgeClasses(): string {
        const sizeClass = this.size === 'sm' ? 'tension-sm' : 'tension-md';
        return `finaces-tension ${sizeClass} ${this.tensionScheme.colorClass}`;
    }

    get showDirectionDelta(): boolean {
        return (this.direction !== undefined || this.delta !== undefined) && this.level !== 'NONE';
    }
}