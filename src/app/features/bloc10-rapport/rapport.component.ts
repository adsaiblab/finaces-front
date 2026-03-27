import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CaseService } from '../../core/services/case.service';
import { RapportExportService } from './services/rapport-export.service';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { RapportGridComponent, RapportMetricsComponent } from './components';
import { FinacesRiskBadgeComponent } from '../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import { FinacesTensionBadgeComponent } from '../../shared/components/atoms/finaces-tension-badge/finaces-tension-badge.component';
import { FinacesScoreGaugeComponent } from '../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';

@Component({
  selector: 'app-rapport-final',
  standalone: true,
  imports: [MatButtonModule,
    RapportGridComponent,
    RapportMetricsComponent,
    FinacesRiskBadgeComponent,
    FinacesTensionBadgeComponent,
    FinacesScoreGaugeComponent,
    MatSnackBarModule,
    DatePipe, DecimalPipe],
  templateUrl: './rapport.component.html',
  styleUrls: ['./rapport.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RapportComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private exportService = inject(RapportExportService);
  private snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Règle 1 & 3: Safe routing extraction
  caseId = '';

  currentCase = signal<EvaluationCaseDetailOut | null>(null);
  isLoading = signal<boolean>(true);
  isExporting = signal<boolean>(false);

  // [UI SIMULATION] - Computed properties to generate realistic mock data for the 14 sections
  mockedFinancials = computed(() => {
    return {
      revenue: '4,500,000 €',
      netIncome: '320,000 €',
      ebitdaMargin: '12.5%',
      equity: '1,200,000 €',
      debt: '450,000 €'
    };
  });

  mockedExpertPillars = computed(() => {
    // Simulated expert qualitative analysis per pillar
    return {
      liquidity: 'Liquidity position is adequate. The current ratio stands above industry benchmarks, ensuring short-term obligations can be met without external financing.',
      solvency: 'Strong solvency with low gearing. The company relies heavily on equity rather than debt.',
      profitability: 'Margins are stable despite recent inflationary pressures on raw materials.',
      capacity: 'Execution capacity is validated by three recent similar projects delivered on time.',
      quality: 'Financial statements are audited by a Tier-1 firm without any reservations.'
    };
  });

  mockedConditions = computed(() => {
    return [
      { type: 'REPORTING', text: 'Provide quarterly cash flow statements during the first year of execution.' },
      { type: 'CAUTION', text: 'Maintain a minimum cash reserve of 100,000 €.' }
    ];
  });

  ngOnInit(): void {
    this.caseId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
    if (!this.caseId) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadCaseData();
  }

  private loadCaseData(): void {
    this.isLoading.set(true);
    this.caseService.getCaseDetail(this.caseId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: EvaluationCaseDetailOut) => {
        this.currentCase.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error loading final report data.', 'Close', { duration: 3000 });
      }
    });
  }

  exportPdf(): void {
    this.isExporting.set(true);
    this.exportService.exportToPdf(this.caseId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.isExporting.set(false);
    });
  }

  exportExcel(): void {
    this.isExporting.set(true);
    this.exportService.exportToExcel(this.caseId, this.currentCase()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.isExporting.set(false);
      this.snackBar.open('Excel Exported Successfully.', 'Close', { duration: 3000 });
    });
  }

  returnToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}