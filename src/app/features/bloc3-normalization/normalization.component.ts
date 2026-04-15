import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { CaseService } from '../../core/services/case.service';
import { FinancialStatementNormalizedSchema } from '../../core/models';
import { FinacesSkeletonLoaderComponent } from '../../shared/components';

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
    FinacesSkeletonLoaderComponent,
    AccountingStandardSectionComponent,
    ComparativeTableComponent,
    AdjustmentsListComponent,
  ],
  templateUrl: './normalization.component.html',
  styleUrls: ['./normalization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NormalizationComponent implements OnInit {
  private readonly caseContext = inject(CaseContextService);
  private readonly router = inject(Router);
  private readonly caseService = inject(CaseService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  public readonly statements = signal<FinancialStatementNormalizedSchema[]>([]);
  public readonly selectedYear = signal<number | null>(null);
  public readonly caseId = signal<string>('');

  public readonly normalizedData = computed(() =>
    this.statements().find((s) => s.fiscal_year === this.selectedYear()) || null
  );

  public readonly isLoading = signal<boolean>(true);
  public readonly isComputingRatios = signal<boolean>(false);
  public readonly isRecalculating = signal<boolean>(false);
  public readonly loadError = signal<boolean>(false);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadNormalizedData();
  }

  private loadNormalizedData(): void {
    this.isLoading.set(true);

    this.caseService
      .getNormalizedFinancials(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.statements.set(data);
          if (data.length > 0 && !this.selectedYear()) {
            this.selectedYear.set(Math.max(...data.map(s => s.fiscal_year)));
          }
          console.warn('[DEBUG adjustments]', this.normalizedData()?.adjustments_count);
          this.isLoading.set(false);
        },
        error: () => {
          this.statements.set([]);
          this.isLoading.set(false);
          this.loadError.set(true);
        },
      });
  }

  public selectYear(year: number): void {
    this.selectedYear.set(year);
  }

  public navigateBackToFinancials(): void {
    this.router.navigate(['/cases', this.caseId(), 'financials']);
  }

  public recalculate(): void {
    this.isRecalculating.set(true);
    this.caseService
      .normalizeFinancials(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Normalization recalculated successfully.', 'OK', {
            duration: 3000,
            panelClass: 'snack-success',
          });
          this.loadNormalizedData();
          this.isRecalculating.set(false);
        },
        error: () => {
          of(null)
            .pipe(delay(1000), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.snackBar.open('Normalization recalculated (Mock).', 'OK', { duration: 3000 });
              this.isRecalculating.set(false);
            });
        },
      });
  }

  public computeRatios(): void {
    this.isComputingRatios.set(true);
    this.caseService
      .computeRatios(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isComputingRatios.set(false);
          this.snackBar.open('Ratios computed successfully. Ready for evaluation.', 'OK', {
            duration: 4000,
            panelClass: 'snack-success',
          });
          this.router.navigate(['/cases', this.caseId(), 'ratios']);
        },
        error: () => {
          of(null)
            .pipe(delay(1500), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
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
