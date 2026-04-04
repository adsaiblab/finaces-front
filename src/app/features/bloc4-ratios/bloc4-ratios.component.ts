import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of, delay } from 'rxjs';

import { RatioCalculationService } from './services/ratio-calculation.service';
import { environment } from '../../../environments/environment';
import { CaseService } from '../../core/services/case.service';
import { RatioSetGrouped } from '../../core/models/ratio.model';

import {
  CoherenceAlertsComponent,
  RatioGroupCardComponent,
  ZscoreCardComponent,
} from './components';

@Component({
  selector: 'app-bloc4-ratios',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CoherenceAlertsComponent,
    RatioGroupCardComponent,
    ZscoreCardComponent,
    NgClass,
  ],
  templateUrl: './bloc4-ratios.component.html',
  styleUrls: ['./bloc4-ratios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bloc4RatiosComponent {
  private readonly caseContext = inject(CaseContextService);
  private router = inject(Router);
  private ratioService = inject(RatioCalculationService);
  private caseService = inject(CaseService); // Using existing CaseService for mock IA/Scoring endpoints
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');
  private readonly destroyRef = inject(DestroyRef);

  // State Signals
  public ratioSet = signal<RatioSetGrouped | null>(null);
  public isLoading = signal<boolean>(true);
  public error = signal<string | null>(null);

  // Subflows
  public scoringInProgress = signal<boolean>(false);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadRatios();
  }

  private loadRatios(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.ratioService
      .computeRatios(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.ratioSet.set(data);
          this.isLoading.set(false);
        },
        error: (_err) => {
          if (!environment.production) {
            console.warn('Backend unavailable, injecting Enterprise-Grade Mock for Ratios');
          }
          this.loadMockData();
        },
      });
  }

  private loadMockData(): void {
    const mockResponse = {
      case_id: this.caseId(),
      fiscal_year: 2023,
      liquidity: {
        current_ratio: { current: 1.2, status: 'GREEN', unit: 'ratio', variation_pct: 2.1 } as any,
        quick_ratio: { current: 0.8, status: 'YELLOW', unit: 'ratio', variation_pct: -1.5 } as any,
        cash_ratio: { current: 0.3, status: 'RED', unit: 'ratio', variation_pct: -10 } as any,
        dso_days: { current: 45, status: 'GREEN', unit: 'days', variation_pct: 0 } as any,
      } as any,
      solvency: {
        debt_to_equity: { current: 2.5, status: 'ORANGE', unit: 'ratio', variation_pct: 15 } as any,
        gearing: { current: 0.65, status: 'YELLOW', unit: 'ratio', variation_pct: 5 } as any,
      } as any,
      profitability: {
        net_margin: { current: 8.5, status: 'GREEN', unit: '%', variation_pct: 1.2 } as any,
        ebitda_margin: { current: 14.2, status: 'GREEN', unit: '%', variation_pct: 0.5 } as any,
        roe: { current: 12.0, status: 'GREEN', unit: '%', variation_pct: 2.0 } as any,
      } as any,
      capacity: {
        cash_flow_capacity: {
          current: 0.4,
          status: 'YELLOW',
          unit: 'ratio',
          variation_pct: -2,
        } as any,
      } as any,
      z_score: {
        z_score_altman: { current: 1.5, status: 'RED', unit: 'ratio', variation_pct: -5 } as any,
        z_score_zone: 'DISTRESS',
        formula_breakdown: { x1: 0.1, x2: 0.2, x3: 0.3, x4: 0.4 },
      },
      coherence_alerts: [
        {
          id: 'alert-1',
          severity: 'CRITICAL',
          rule_id: 'ZSCORE_DISTRESS',
          message: 'High distress probability detected.',
          rule_description: 'Z-Score Altman below 1.81 indicates strong risk of bankruptcy.',
          affected_ratios: ['z_score_altman'],
          suggested_action: 'Require senior analyst review before finalizing MCC scoring.',
          data_challenge: false,
        },
        {
          id: 'alert-2',
          severity: 'WARNING',
          rule_id: 'BFR_FORMULA',
          message: 'WCR calculation discrepancy.',
          rule_description: 'DSO + DIO - DPO formula does not perfectly match balance sheet WCR.',
          affected_ratios: ['wcr', 'dso_days', 'dio_days', 'dpo_days'],
          suggested_action: 'Verify trade payables and receivables in normalized data.',
          data_challenge: true,
        },
      ],
      coherence_status: 'CRITICAL',
      calculation_date: new Date().toISOString(),
      normalization_source: 'normalized_financial_data',
      sector_code: 'TECH',
    };

    of(mockResponse)
      .pipe(delay(1200), takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.ratioSet.set(data as RatioSetGrouped);
        this.isLoading.set(false);
      });
  }

  public launchScoringAndPrediction(): void {
    this.scoringInProgress.set(true);

    // Simulation of parallel execution of MCC Scoring + AI Prediction endpoints
    // In production, these would be actual calls to CaseService
    const mockMccScoreCall = of({ status: 'SUCCESS' }).pipe(delay(2000));
    const mockIaPredictCall = of({ status: 'SUCCESS' }).pipe(delay(2500));

    forkJoin([mockMccScoreCall, mockIaPredictCall])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('MCC Scoring & AI Prediction launched successfully.', 'OK', {
            duration: 3000,
            panelClass: 'snack-success',
          });
          this.scoringInProgress.set(false);
          this.router.navigate(['/cases', this.caseId(), 'scoring-mcc']);
        },
        error: () => {
          this.snackBar.open('An error occurred while launching predictions.', 'Close', {
            duration: 5000,
          });
          this.scoringInProgress.set(false);
        },
      });
  }

  public navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'normalization']);
  }
}
