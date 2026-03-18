import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { EvaluationCaseDetailOut } from '../../../../core/models/case.model';
import { FinacesRiskBadgeComponent } from '../../../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';

@Component({
    selector: 'app-recent-cases-table',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        RouterLink,
        FinacesRiskBadgeComponent,
        DecimalPipe,
        SlicePipe
    ],
    templateUrl: './recent-cases-table.component.html',
    styleUrls: ['./recent-cases-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentCasesTableComponent {
    // Input Signal strict (Angular 17.1+)
    readonly cases = input.required<EvaluationCaseDetailOut[]>();
    readonly displayedColumns: string[] = ['reference', 'bidder', 'amount', 'status', 'mcc_class', 'actions'];

    // Génère une teinte HSL déterministe (hue uniquement, sans couleur en dur).
    // La luminosité et saturation sont fixées pour rester cohérentes avec le design system.
    getAvatarStyle(name: string | undefined): { background: string } {
        if (!name) {
            return { background: 'var(--color-content-secondary)' };
        }
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Hue: 0–359, Saturation: 45% (sobre), Lightness: 42% (lisible sur fond blanc Manifeste)
        const hue = Math.abs(hash) % 360;
        return { background: `hsl(${hue}, 45%, 42%)` };
    }

    getInitials(name: string | undefined): string {
        return name ? name.substring(0, 2).toUpperCase() : 'NA';
    }
}