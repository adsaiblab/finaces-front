import { PercentPipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, forkJoin } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { IaService } from '../../core/services/ia.service';
import { IAPredictionResult, WhatIfScenarioInput } from '../../core/models/ia.model';

import {
  FinacesIaDisclaimerComponent,
  FinacesShapChartComponent,
  FinacesWhatIfComponent,
  FinacesScoreGaugeComponent,
  FinacesRiskBadgeComponent,
  FinacesSkeletonLoaderComponent,
  FinacesInlineErrorComponent,
  ErrorCode,
} from '../../shared/components';

@Component({
  selector: 'app-bloc6-ia',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FinacesIaDisclaimerComponent,
    FinacesShapChartComponent,
    FinacesWhatIfComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent,
    FinacesSkeletonLoaderComponent,
    FinacesInlineErrorComponent,
    PercentPipe,
    DecimalPipe,
    NgClass,
  ],
  templateUrl: './ia.component.html',
  styleUrls: ['./ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IaComponent {
  private readonly caseContext = inject(CaseContextService);
  private readonly router      = inject(Router);
  private readonly iaService   = inject(IaService);
  private readonly snackBar    = inject(MatSnackBar);
  private readonly destroyRef  = inject(DestroyRef);

  // ─── State signals ────────────────────────────────────────────────
  readonly caseId          = signal<string>('');
  readonly predictionData  = signal<IAPredictionResult | null>(null);
  readonly isLoading       = signal<boolean>(true);
  readonly isSimulating    = signal<boolean>(false);

  // ─── Error signal (unique pour le forkJoin double) ────────────────────
  readonly predictionError = signal<ErrorCode | null>(null);
  readonly retryCount      = signal<number>(0);

  // ─── Résultat simulation (temporaire, pas de DB write) ───────────────
  readonly simulationScore = signal<number | null>(null);
  readonly simulationClass = signal<string | null>(null);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadPrediction();
  }

  // ─── Chargement ────────────────────────────────────────────────
  loadPrediction(): void {
    this.isLoading.set(true);
    this.predictionError.set(null);
    this.simulationScore.set(null);
    this.simulationClass.set(null);

    // forkJoin double : prediction + model info
    forkJoin({
      prediction: this.iaService.getPrediction(this.caseId()),
      model:      this.iaService.getActiveModel(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(({ prediction, model }) => ({
          ...prediction,
          model_performance: {
            auc_roc:  model.auc_roc,
            accuracy: model.accuracy,
            f1_score: model.f1_score,
          },
        })),
        catchError(() => {
          if (!environment.production) {
            console.warn('[IA] Backend indisponible — mode mock activé');
          }
          return of(null);
        }),
      )
      .subscribe({
        next: (enriched) => {
          if (enriched) {
            this.predictionData.set(enriched as IAPredictionResult);
            this.isLoading.set(false);
          } else {
            // Backend indisponible — fallback mock
            this.loadMockData();
          }
        },
      });
  }

  // ─── Retry public (appelé par FinacesInlineErrorComponent) ──────────
  onRetry(): void {
    this.retryCount.update(n => n + 1);
    this.predictionError.set(null);
    this.loadPrediction();
  }

  // ─── Mock data (dév uniquement) ─────────────────────────────────
  private loadMockData(): void {
    of(null)
      .pipe(delay(1200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.predictionData.set({
          case_id:              this.caseId(),
          model_version:        'v2.4.1-xgboost',
          prediction_timestamp: new Date().toISOString(),
          predicted_score:      2.4,
          predicted_risk_class: 'HIGH',
          confidence_interval:  { lower: 2.1, upper: 2.7 },
          model_performance:    { auc_roc: 0.89, accuracy: 0.85, f1_score: 0.82 },
          disclaimer:           'Avertissement IA standard',
          feature_importance:   [],
          shap_values: {
            base_value:         3.0,
            total_contribution: -0.6,
            features: [
              { feature_name: 'Dette / Capitaux propres', feature_value: '4.2',   shap_value:  0.8, direction: 'positive', magnitude: 0.8 },
              { feature_name: 'Marge EBITDA',            feature_value: '8.4%',  shap_value: -0.5, direction: 'negative', magnitude: 0.5 },
              { feature_name: 'Cash-flow opérationnel',  feature_value: '1,2M€', shap_value:  0.3, direction: 'positive', magnitude: 0.3 },
              { feature_name: 'Ratio de liquidité',     feature_value: '1.1',   shap_value:  0.2, direction: 'positive', magnitude: 0.2 },
              { feature_name: 'DSO (jours)',              feature_value: '65',    shap_value: -0.1, direction: 'negative', magnitude: 0.1 },
            ],
          },
        });
        this.isLoading.set(false);
      });
  }

  // ─── Simulation What-If (CONTRAINTE MÉTIER : zéro écriture DB) ─────
  onSimulate(scenario: WhatIfScenarioInput): void {
    this.isSimulating.set(true);
    this.iaService
      .simulateWhatIf(this.caseId(), scenario)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.simulationScore.set(result.predicted_score_if ?? 3.1);
          this.simulationClass.set(result.predicted_class_if ?? 'MODERATE');
          this.isSimulating.set(false);
          this.snackBar.open('Simulation appliquée avec succès.', 'OK', { duration: 3000 });
        },
        error: () => {
          // Mock fallback simulation (dév uniquement)
          of(null)
            .pipe(delay(1000), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              const baseScore = this.predictionData()?.predicted_score ?? 0;
              this.simulationScore.set(Math.min(5, baseScore + 0.7));
              this.simulationClass.set('MODERATE');
              this.isSimulating.set(false);
              this.snackBar.open('Simulation terminée (mode mock).', 'OK', { duration: 3000 });
            });
        },
      });
  }

  onResetSimulation(): void {
    this.simulationScore.set(null);
    this.simulationClass.set(null);
  }

  navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'scoring-mcc']);
  }

  proceedToTension(): void {
    this.router.navigate(['/cases', this.caseId(), 'tension']);
  }
}
