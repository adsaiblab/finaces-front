import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TensionLevel = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

interface TensionConfig {
    label: string;
    colorClass: string;
}

@Component({
    selector: 'finaces-tension-badge',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './finaces-tension-badge.component.html',
    styleUrls: ['./finaces-tension-badge.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesTensionBadgeComponent implements OnChanges {
    @Input({ required: true }) level: TensionLevel = 'NONE';

    config: TensionConfig = { label: 'Normale', colorClass: 'tension-none' };

    private readonly configMap: Record<TensionLevel, TensionConfig> = {
        NONE: { label: 'Normale', colorClass: 'tension-none' },
        MILD: { label: 'Légère', colorClass: 'tension-mild' },
        MODERATE: { label: 'Modérée', colorClass: 'tension-moderate' },
        SEVERE: { label: 'Sévère', colorClass: 'tension-severe' }
    };

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['level']) {
            this.config = this.configMap[this.level] || this.configMap.NONE;
            this.cdr.markForCheck();
        }
    }
}