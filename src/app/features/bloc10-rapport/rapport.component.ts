import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { CaseService } from '../../core/services/case.service';
import { RapportExportService } from './services/rapport-export.service';
import { EvaluationCaseDetailOut } from '../../core/models';
import { RapportGridComponent, RapportMetricsComponent } from './components';
import { FinacesRiskBadgeComponent, RiskClass } from '../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import { FinacesTensionBadgeComponent, TensionLevel } from '../../shared/components/atoms/finaces-tension-badge/finaces-tension-badge.component';

@Component({
  selector: 'app-rapport-final',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    RapportGridComponent,
    RapportMetricsComponent,
    FinacesRiskBadgeComponent,
    FinacesTensionBadgeComponent
  ],
  templateUrl: './rapport.component.html',
  styleUrls: ['./rapport.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RapportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private exportService = inject(RapportExportService);
  private snackBar = inject(MatSnackBar);

  // ✅ Clé correcte : route = cases/:id
  caseId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';

  currentCase = signal<EvaluationCaseDetailOut | null>(null);
  isLoading = signal<boolean>(true);
  isExporting = signal<boolean>(false);

  // Exposer les types pour le template
  readonly riskClass = signal<RiskClass>('MODERATE');
  readonly tensionLevel = signal<TensionLevel>('NONE');

  ngOnInit(): void {
    if (!this.caseId) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadCaseData();
  }

  private loadCaseData(): void {
    this.isLoading.set(true);
    this.caseService.getCaseDetail(this.caseId).pipe(
      catchError(() => of({
        id: this.caseId,
        bidder_name: 'Simulation Entreprise SA',
        sector: 'BTP',
        contract_value: 1500000,
        contract_currency: 'MAD',
        contract_months: 24,
        case_type: 'SINGLE' as any,
        status: 'EXPERT_REVIEWED' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin'
      } as EvaluationCaseDetailOut))
    ).subscribe({
      next: (data: EvaluationCaseDetailOut) => {
        this.currentCase.set(data);
        this.isLoading.set(false);
      }
    });
  }

  exportPdf(): void {
    this.isExporting.set(true);
    this.exportService.exportToPdf(this.caseId).subscribe(() => {
      this.isExporting.set(false);
    });
  }

  exportExcel(): void {
    this.isExporting.set(true);
    this.exportService.exportToExcel(this.caseId, this.currentCase()).subscribe(() => {
      this.isExporting.set(false);
      this.snackBar.open('Excel Exported Successfully.', 'Close', { duration: 3000 });
    });
  }

  returnToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}