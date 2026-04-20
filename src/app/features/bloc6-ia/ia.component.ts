import { PercentPipe, DecimalPipe, NgClass } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, forkJoin } from 'rxjs';
import { delay, map } from 'rxjs/operators';
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
  ShapFeatureImportanceComponent,
  FinacesWhatIfComponent,
  FinacesScoreGaugeComponent,
  FinacesRiskBadgeComponent,
  FinacesSkeletonLoaderComponent,
  FinacesInlineErrorComponent,
  ErrorCode,
  FinacesEmptyStateComponent,
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
    ShapFeatureImportanceComponent,
    FinacesWhatIfComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent,
    FinacesSkeletonLoaderComponent,
    FinacesInlineErrorComponent,
    FinacesEmptyStateComponent,
    PercentPipe,
    DecimalPipe,
    NgClass,
  ],
  templateUrl: './ia.component.html',
  styleUrls: ['./ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IaComponent implements OnInit {
  private readonly caseContext = inject(CaseContextService);
  private readonly router      = inject(Router);
  private readonly iaService   = inject(IaService);
  private readonly snackBar    = inject(MatSnackBar);
  private readonly destroyRef  = inject(DestroyRef);

  // --- Identite ---
  readonly caseId = signal<string>('');

  // --- States ---
  readonly isLoading           = signal<boolean>(true);
  readonly isPredictionLoading = signal<boolean>(true);
  readonly isModelLoading      = signal<boolean>(true);

  // --- Donnees ---
  readonly predictionData = signal<IAPredictionResult | null>(null);

  // --- Erreurs ---
  readonly predictionError = signal<ErrorCode | null>(null);
  readonly retryCount      = signal<number>(0);
  readonly whatIfError     = signal<ErrorCode | null>(null);

  // --- Simulation ---
  readonly isSimulating    = signal<boolean>(false);
  readonly simulationScore = signal<number | null>(null);
  readonly simulationClass = signal<string | null>(null);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadPrediction();
  }

  // --- Chargement forkJoin ---
  loadPrediction(): void {
    this.isLoading.set(true);
    this.isPredictionLoading.set(true);
    this.isModelLoading.set(true);
    this.predictionError.set(null);
    this.predictionData.set(null);
    this.simulationScore.set(null);
    this.simulationClass.set(null);

    forkJoin({
      prediction: this.iaService.getPrediction(this.caseId()),
      model:      this.iaService.getActiveModel(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(({ prediction, model }) => {
          this.isPredictionLoading.set(false);
          this.isModelLoading.set(false);

          const p = prediction as any;
          const metrics = (model as any).metrics ?? {};
          const auc   = metrics.auc_roc  ?? 0;
          const acc   = metrics.accuracy  ?? 0;
          const f1    = metrics.f1_score  ?? 0;
          
          const prob = p.ia_probability_default ?? 0;
          const halfInterval = parseFloat(((1 - auc) * 0.5).toFixed(3));

          return {
            case_id:              p.case_id,
            model_version:        p.version ?? 'xgboost',
            prediction_timestamp: p.predicted_at,
            predicted_score:      parseFloat((p.ia_score / 20).toFixed(2)),
            predicted_risk_class: p.ia_risk_class,
            confidence_interval: {
              lower: Math.max(0, parseFloat((prob - halfInterval).toFixed(3))),
              upper: Math.min(1, parseFloat((prob + halfInterval).toFixed(3))),
            },
            model_performance: {
              auc_roc:  auc,
              accuracy: acc,
              f1_score: f1,
            },
            disclaimer: 'Scores générés par apprentissage automatique à titre indicatif.',
            feature_importance: (metrics.feature_importance ?? []).map((f: any) => ({
              feature_name: f.feature_name ?? f.feature,
              importance_score: f.importance_score ?? f.importance,
              rank: f.rank ?? 0,
              correlation_with_target: f.correlation_with_target ?? 0
            })),
            shap_values: {
              base_value:         0,
              total_contribution: 0,
              features: p.explanations?.top_features?.map((f: any) => ({
                feature_name:  f.feature_name,
                feature_value: String(f.feature_value),
                shap_value:    f.shap_value,
                direction:     f.impact > 0 ? 'positive' : 'negative',
                magnitude:     Math.abs(f.impact ?? 0),
              })) ?? [],
            },
          };
        }),
      )
      .subscribe({
        next: (enriched) => {
          this.predictionData.set(enriched as unknown as IAPredictionResult);
          this.isLoading.set(false);
        },
        error: (err) => {
          const status = err?.status;
          if (status === 404) {
             // Treat 404 as "no data" state
             this.predictionData.set(null);
             this.isLoading.set(false);
             this.isPredictionLoading.set(false);
             this.isModelLoading.set(false);
             return;
          }
          if (status === 401 || status === 403) {
            this.isLoading.set(false);
            this.isPredictionLoading.set(false);
            this.isModelLoading.set(false);
            this.router.navigate(['/auth/login']);
            return;
          }

          if (!environment.production) {
            console.warn('[IA] Backend indisponible — mode mock active');
            this.isPredictionLoading.set(false);
            this.isModelLoading.set(false);
            this.loadMockData();
          } else {
            this.predictionError.set('server');
            this.isPredictionLoading.set(false);
            this.isModelLoading.set(false);
            this.isLoading.set(false);
          }
        },
      });
  }

  // --- Retry public ---
  onRetry(): void {
    this.retryCount.update(n => n + 1);
    this.predictionError.set(null);
    this.loadPrediction();
  }

  onRetryLoad(): void {
    this.onRetry();
  }

  // --- Mock data (developpement uniquement) ---
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
              { feature_name: 'Cash-flow operationnel',  feature_value: '1,2M',  shap_value:  0.3, direction: 'positive', magnitude: 0.3 },
              { feature_name: 'Ratio de liquidite',      feature_value: '1.1',   shap_value:  0.2, direction: 'positive', magnitude: 0.2 },
              { feature_name: 'DSO (jours)',              feature_value: '65',    shap_value: -0.1, direction: 'negative', magnitude: 0.1 },
            ],
          },
        });
        this.isLoading.set(false);
      });
  }

  // --- Simulation What-If ---
  onSimulate(scenario: WhatIfScenarioInput): void {
    this.isSimulating.set(true);
    this.whatIfError.set(null);

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
        error: (err) => {
          const status = err?.status;
          if (!environment.production) {
            of(null)
              .pipe(delay(1000), takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                const baseScore = this.predictionData()?.predicted_score ?? 0;
                this.simulationScore.set(Math.min(5, baseScore + 0.7));
                this.simulationClass.set('MODERATE');
                this.isSimulating.set(false);
                this.snackBar.open('Simulation terminée (mode mock).', 'OK', { duration: 3000 });
              });
          } else {
            this.whatIfError.set(status === 422 ? 'generic' : 'server');
            this.isSimulating.set(false);
          }
        },
      });
  }

  onResetSimulation(): void {
    this.simulationScore.set(null);
    this.simulationClass.set(null);
    this.whatIfError.set(null);
  }

  navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'scoring-mcc']);
  }

  proceedToTension(): void {
    this.router.navigate(['/cases', this.caseId(), 'tension']);
  }
}
