import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { TensionLevel } from '../../../../core/models/scoring.model';
import { TensionDirection } from '../../../../core/models/tension.model';

@Component({
    selector: 'app-tension-banner',
    standalone: true,
    imports: [MatIconModule, NgClass, DecimalPipe],
    templateUrl: './tension-banner.component.html',
    styleUrls: ['./tension-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TensionBannerComponent {
    public level = input<TensionLevel>(TensionLevel.NONE);
    public direction = input<TensionDirection>('NONE' as TensionDirection);
    public deltaScore = input<number>(0);
    public recommendation = input<string>('');

    public getBannerConfig(): { icon: string; classes: string; title: string } {
        switch (this.level()) {
            case TensionLevel.SEVERE:
                return {
                    icon: 'warning',
                    classes: 'bg-[color:var(--color-error)] bg-opacity-10 border-[color:var(--color-error)] text-[color:var(--color-error)]',
                    title: 'CRITICAL DIVERGENCE'
                };
            case TensionLevel.MODERATE:
                return {
                    icon: 'report_problem',
                    classes: 'bg-[color:var(--color-warning)] bg-opacity-10 border-[color:var(--color-warning)] text-[color:var(--color-warning)]',
                    title: 'MODERATE TENSION'
                };
            case TensionLevel.MILD:
                return {
                    icon: 'info',
                    classes: 'bg-[color:var(--color-info)] bg-opacity-10 border-[color:var(--color-info)] text-[color:var(--color-info)]',
                    title: 'MILD DEVIATION'
                };
            case TensionLevel.NONE:
            default:
                return {
                    icon: 'check_circle',
                    classes: 'bg-[color:var(--color-success)] bg-opacity-10 border-[color:var(--color-success)] text-[color:var(--color-success)]',
                    title: 'ALIGNED SCORES'
                };
        }
    }

    public getDirectionText(): string {
        const dir = this.direction();
        if (dir === 'UP') return 'AI is more optimistic (+)';
        if (dir === 'DOWN') return 'AI is more pessimistic (-)';
        return 'No deviation';
    }
}