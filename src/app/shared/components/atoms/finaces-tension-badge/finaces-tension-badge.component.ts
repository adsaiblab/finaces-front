import { NgClass } from '@angular/common';
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

export type TensionLevel = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
export type Direction = 'UP' | 'DOWN';

interface TensionScheme { icon: string; labelFr: string; colorClass: string; }

@Component({
    selector: 'finaces-tension-badge',
    standalone: true,
    imports: [MatIconModule, NgClass],
    templateUrl: './finaces-tension-badge.component.html',
    styleUrls: ['./finaces-tension-badge.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesTensionBadgeComponent {
    readonly level = input.required<TensionLevel>();
    readonly direction = input<Direction | undefined>(undefined);
    readonly delta = input<number | undefined>(undefined);
    readonly size = input<'sm' | 'md'>('md');

    private readonly schemeMap: Record<TensionLevel, TensionScheme> = {
        NONE: { icon: 'check_circle', labelFr: 'Convergence', colorClass: 'tension-none' },
        MILD: { icon: 'info', labelFr: 'Tension légère', colorClass: 'tension-mild' },
        MODERATE: { icon: 'warning', labelFr: 'Tension modérée', colorClass: 'tension-moderate' },
        SEVERE: { icon: 'crisis_alert', labelFr: 'TENSION MAJEURE', colorClass: 'tension-severe' }
    };

    readonly tensionScheme = computed<TensionScheme>(() => {
        return this.schemeMap[this.level()] || this.schemeMap.NONE;
    });

    readonly displayDelta = computed<string>(() => {
        const d = this.delta();
        if (d === undefined || d === null) return '';
        const sign = d > 0 ? '+' : '';
        return `${sign}${d.toFixed(2)}`;
    });

    readonly directionIcon = computed<string>(() => {
        return this.direction() === 'UP' ? 'trending_up' : 'trending_down';
    });

    readonly badgeClasses = computed<string>(() => {
        const sizeClass = this.size() === 'sm' ? 'tension-sm' : 'tension-md';
        return `finaces-tension ${sizeClass} ${this.tensionScheme().colorClass}`;
    });

    readonly showDirectionDelta = computed<boolean>(() => {
        return (this.direction() !== undefined || this.delta() !== undefined) && this.level() !== 'NONE';
    });
}
