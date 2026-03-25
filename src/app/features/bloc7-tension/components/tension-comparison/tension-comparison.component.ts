import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FinacesScoreGaugeComponent, FinacesRiskBadgeComponent } from '../../../../shared/components';

@Component({
    selector: 'app-tension-comparison',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        FinacesScoreGaugeComponent,
        FinacesRiskBadgeComponent
    ],
    templateUrl: './tension-comparison.component.html',
    styleUrls: ['./tension-comparison.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TensionComparisonComponent {
    public mccScore = input.required<number>();
    public mccClass = input.required<string>();

    public iaScore = input.required<number>();
    public iaClass = input.required<string>();

    public deltaScore = input.required<number>();
    public classDivergence = input.required<boolean>();

    public getDeltaColorClass(): string {
        const delta = Math.abs(this.deltaScore());
        if (delta >= 1.0) return 'text-[color:var(--color-error)]';
        if (delta >= 0.5) return 'text-[color:var(--color-warning)]';
        if (delta >= 0.2) return 'text-[color:var(--color-info)]';
        return 'text-[color:var(--color-success)]';
    }
}