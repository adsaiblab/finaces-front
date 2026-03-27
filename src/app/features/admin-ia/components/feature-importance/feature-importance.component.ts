import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { IaFeatureImportance } from '../../../../core/models/ia-admin.model';

@Component({
    selector: 'app-feature-importance',
    standalone: true,
    imports: [NgClass, DecimalPipe],
    templateUrl: './feature-importance.component.html',
    styleUrls: ['./feature-importance.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureImportanceComponent {
    features = input<IaFeatureImportance[]>([]);

    getPillarColor(pillar: string): string {
        const colors: Record<string, string> = {
            'LIQUIDITY': 'bg-blue-500',
            'SOLVENCY': 'bg-purple-500',
            'PROFITABILITY': 'bg-green-500',
            'CAPACITY': 'bg-orange-500',
            'MACRO': 'bg-teal-500'
        };
        return colors[pillar] || 'bg-gray-500';
    }
}