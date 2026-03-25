import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PillarScore } from '../../../../core/models/scoring.model';

@Component({
    selector: 'app-pillar-detail-card',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, DecimalPipe],
    templateUrl: './pillar-detail-card.component.html',
    styleUrls: ['./pillar-detail-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PillarDetailCardComponent {
    public pillar = input<PillarScore>({ id: '', name: '', score: 0, weight: 0, status: 'GOOD', key_drivers: [] } as unknown as PillarScore);

    public getStatusColor(): string {
        const status = this.pillar().status;
        switch (status) {
            case 'EXCELLENT':
            case 'GOOD': return 'text-[color:var(--color-success)]';
            case 'FAIR': return 'text-[color:var(--color-warning)]';
            case 'POOR':
            case 'CRITICAL': return 'text-[color:var(--color-error)]';
            default: return 'text-[color:var(--color-content-secondary)]';
        }
    }

    public getPillarIcon(): string {
        const name = this.pillar().name.toUpperCase();
        if (name.includes('LIQUIDITY')) return 'water_drop';
        if (name.includes('SOLVENCY')) return 'shield';
        if (name.includes('PROFITABILITY')) return 'trending_up';
        if (name.includes('CAPACITY')) return 'bolt';
        if (name.includes('QUALITY')) return 'verified';
        return 'analytics';
    }
}