import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NormalizationAdjustment } from '../../../../core/models';

@Component({
    selector: 'app-adjustments-list',
    standalone: true,
    imports: [CommonModule, MatIconModule, CurrencyPipe],
    templateUrl: './adjustments-list.component.html',
    styleUrls: ['./adjustments-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdjustmentsListComponent {
    public adjustments = input<NormalizationAdjustment[]>([]);

    public getDeltaColorClass(amount: number): string {
        if (amount === 0) return 'text-[color:var(--color-success)]';
        if (amount > 0) return 'text-[color:var(--color-success)]';
        return 'text-[color:var(--color-error)]';
    }

    public getPercentageClass(confidence: number): string {
        if (confidence >= 90) return 'text-[color:var(--color-success)]';
        if (confidence >= 70) return 'text-[color:var(--color-warning)]';
        return 'text-[color:var(--color-error)]';
    }
}