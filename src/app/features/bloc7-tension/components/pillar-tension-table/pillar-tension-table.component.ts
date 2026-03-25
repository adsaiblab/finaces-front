import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { PillarComparison } from '../../../../core/models/tension.model';

@Component({
    selector: 'app-pillar-tension-table',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatIconModule, DecimalPipe],
    templateUrl: './pillar-tension-table.component.html',
    styleUrls: ['./pillar-tension-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PillarTensionTableComponent {
    public pillars = input.required<PillarComparison[]>();

    public displayedColumns: string[] = ['pillar', 'mcc', 'ia', 'delta', 'status'];

    public getDeltaColorClass(delta: number): string {
        const absDelta = Math.abs(delta);
        if (absDelta >= 0.5) return 'text-[color:var(--color-error)]';
        if (absDelta >= 0.2) return 'text-[color:var(--color-warning)]';
        return 'text-[color:var(--color-success)]';
    }
}