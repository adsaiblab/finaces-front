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

    // Génère une couleur déterministe basée sur le nom pour l'avatar.
    // Exception consentie sur les couleurs en dur car c'est un utilitaire pseudo-aléatoire pour les avatars.
    getAvatarColor(name: string | undefined): string {
        if (!name) return '#6B7280'; // fallback var(--color-content-secondary)
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    getInitials(name: string | undefined): string {
        return name ? name.substring(0, 2).toUpperCase() : 'NA';
    }
}