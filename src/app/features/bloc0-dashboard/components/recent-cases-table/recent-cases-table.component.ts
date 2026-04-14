import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DecimalPipe, SlicePipe, NgStyle } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { EvaluationCaseDetailOut, CaseStatus } from '../../../../core/models/case.model';
import { inject } from '@angular/core';
import { FinacesRiskBadgeComponent } from '../../../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';

@Component({
  selector: 'app-recent-cases-table',
  standalone: true,
  imports: [
    NgStyle,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    FinacesRiskBadgeComponent,
    DecimalPipe,
    SlicePipe,
  ],
  templateUrl: './recent-cases-table.component.html',
  styleUrls: ['./recent-cases-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentCasesTableComponent {
  private readonly router = inject(Router);

  // Input Signal strict (Angular 17.1+)
  readonly cases = input<EvaluationCaseDetailOut[]>([]);
  readonly displayedColumns: string[] = [
    'reference',
    'bidder',
    'amount',
    'status',
    'mcc_class',
    'actions',
  ];

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

  navigateToCase(element: EvaluationCaseDetailOut): void {
    const id = element.id;
    const status = element.status;

    let route = `/cases/${id}/recevabilite`; // Par défaut

    switch (status) {
      case CaseStatus.DRAFT:
        route = `/cases/${id}/recevabilite`;
        break;
      case CaseStatus.PENDING_GATE:
        route = `/cases/${id}/gate`;
        break;
      case CaseStatus.FINANCIAL_INPUT:
        route = `/cases/${id}/financials`;
        break;
      // Les autres statuts peuvent aussi renvoyer vers recevabilite ou workspace par défaut
    }

    this.router.navigateByUrl(route);
  }
}
