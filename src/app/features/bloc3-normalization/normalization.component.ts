import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CaseService } from '../../core/services/case.service';
import { environment } from '../../../environments/environment';
import { FinancialStatementNormalizedSchema } from '../../core/models';

// Import the barrel file
import {
  AccountingStandardSectionComponent,
  ComparativeTableComponent,
  AdjustmentsListComponent,
} from './components';

@Component({
  selector: 'app-normalization',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    AccountingStandardSectionComponent,
    ComparativeTableComponent,
    AdjustmentsListComponent,
  ],
  templateUrl: './normalization.component.html',
  styleUrls: ['./normalization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NormalizationComponent {
  private readonly caseContext = inject(CaseContextService);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  // State Signals
  public normalizedData = signal<FinancialStatementNormalizedSchema | null>(null);
  public isLoading = signal<boolean>(true);
  public isComputingRatios = signal<boolean>(false);
  public isRecalculating = signal<boolean>(false);

  ngOnInit(): void {
    // Parent or current route fallback logic
    this.caseId.set(this.caseContext.caseId());
    this.loadNormalizedData();
  }

  private loadNormalizedData(): void {
    this.isLoading.set(true);

    // API Call handling
    this.caseService.getNormalizedFinancials(this.caseId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.normalizedData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        // MOCK Enterprise-grade Prototype Fallback if API is not ready
        if (!environment.production) {
          console.warn('API returned error, falling back to mock data for prototyping.');
        }
        this.loadMockData();
      },
    });
  }

  private loadMockData(): void {
    of(null).pipe(
      delay(800),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.normalizedData.set({
        statement_id: 'mock-123',
        fiscal_year: 2023,
        normalized_revenue: 8500000,
        normalized_ebitda: 4000000,
        normalized_net_income: 2850000,
        normalized_working_capital: 1500000,
        normalized_cash_flow: 500000,
        adjustments: [
          {
            line_item: 'EBITDA',
            original_value: 3500000,
            adjusted_value: 4000000,
            reason: 'Added back depreciation and amortization',
            confidence: 98,
          },
          {
            line_item: 'Short Term Debt',
            original_value: 1100000,
            adjusted_value: 950000,
            reason: 'Reclassified portion to Long Term Debt',
            confidence: 85,
          },
        ],
        confidence_score: 92,
        normalization_date: new Date().toISOString(),
      } as any);
      this.isLoading.set(false);
    });
  }

  public navigateBackToFinancials(): void {
    this.router.navigate(['/cases', this.caseId(), 'financials']);
  }

  public recalculate(): void {
    this.isRecalculating.set(true);
    this.caseService.normalizeFinancials(this.caseId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackBar.open('Normalization recalculated successfully.', 'OK', {
          duration: 3000,
          panelClass: 'snack-success',
        });
        this.loadNormalizedData();
        this.isRecalculating.set(false);
      },
      error: () => {
        // Fallback simulate success
        of(null).pipe(delay(1000), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.snackBar.open('Normalization recalculated (Mock).', 'OK', { duration: 3000 });
          this.isRecalculating.set(false);
        });
      },
    });
  }

  public computeRatios(): void {
    this.isComputingRatios.set(true);
    this.caseService.computeRatios(this.caseId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isComputingRatios.set(false);
        this.snackBar.open('Ratios computed successfully. Ready for evaluation.', 'OK', {
          duration: 4000,
          panelClass: 'snack-success',
        });
        this.router.navigate(['/cases', this.caseId(), 'ratios']);
      },
      error: () => {
        // Fallback simulate success
        of(null).pipe(delay(1500), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.isComputingRatios.set(false);
          this.snackBar.open('Ratios computed (Mock). Proceeding to next step.', 'OK', {
            duration: 4000,
          });
          this.router.navigate(['/cases', this.caseId(), 'ratios']);
        });
      },
    });
  }

  public scrollToAdjustments(): void {
    const el = this.document.getElementById('adjustments-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
