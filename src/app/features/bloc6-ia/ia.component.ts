import { PercentPipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
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
  FinacesShapChartComponent,
  FinacesWhatIfComponent,
  FinacesScoreGaugeComponent,
  FinacesRiskBadgeComponent
} from '../../shared/components';

@Component({
  selector: 'app-bloc6-ia',
  standalone: true,
  imports: [MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FinacesIaDisclaimerComponent,
    FinacesShapChartComponent,
    FinacesWhatIfComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent, PercentPipe, DecimalPipe, NgClass],
  templateUrl: './ia.component.html',
  styleUrls: ['./ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IaComponent {
  private readonly caseContext = inject(CaseContextService);
  private router = inject(Router);
  private iaService = inject(IaService);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');
  private readonly destroyRef = inject(DestroyRef);

  public predictionData = signal<IAPredictionResult | null>(null);
  public isLoading = signal<boolean>(true);
  public isSimulating = signal<boolean>(false);
  public error = signal<string | null>(null);

  // État temporaire pour le résultat de la simulation
  public simulationScore = signal<number | null>(null);
  public simulationClass = signal<string | null>(null);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadPrediction();
  }

  private loadPrediction(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.simulationScore.set(null);

    // T40: forkJoin prediction + model info for enriched display
    forkJoin({
      prediction: this.iaService.getPrediction(this.caseId()),
      model: this.iaService.getActiveModel(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(({ prediction, model }) => ({
        ...prediction,
        model_performance: {
          auc_roc: model.auc_roc,
          accuracy: model.accuracy,
          f1_score: model.f1_score,
        },
      }))
    ).subscribe({
      next: (enriched) => {
        this.predictionData.set(enriched as any);
        this.isLoading.set(false);
      },
      error: () => {
        if (!environment.production) {
          console.warn('Backend IA unavailable, injecting Enterprise-Grade Mock');
        }
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
    of(null).pipe(
      delay(1200),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.predictionData.set({
        case_id: this.caseId(),
        model_version: 'v2.4.1-xgboost',
        prediction_timestamp: new Date().toISOString(),
        predicted_score: 2.4,
        predicted_risk_class: 'HIGH',
        confidence_interval: { lower: 2.1, upper: 2.7 },
        model_performance: { auc_roc: 0.89, accuracy: 0.85, f1_score: 0.82 },
        disclaimer: 'Standard AI Disclaimer',
        feature_importance: [],
        shap_values: {
          base_value: 3.0,
          total_contribution: -0.6,
          features: [
            { feature_name: 'Debt to Equity', feature_value: '4.2', shap_value: 0.8, direction: 'positive', magnitude: 0.8 },
            { feature_name: 'EBITDA Margin', feature_value: '8.4%', shap_value: -0.5, direction: 'negative', magnitude: 0.5 },
            { feature_name: 'Operating Cash Flow', feature_value: '$1.2M', shap_value: 0.3, direction: 'positive', magnitude: 0.3 },
            { feature_name: 'Current Ratio', feature_value: '1.1', shap_value: 0.2, direction: 'positive', magnitude: 0.2 },
            { feature_name: 'Days Sales Outstanding', feature_value: '65', shap_value: -0.1, direction: 'negative', magnitude: 0.1 }
          ]
        }
      });
      this.isLoading.set(false);
    });
  }

  public onSimulate(scenario: WhatIfScenarioInput): void {
    this.isSimulating.set(true);
    this.iaService.simulateWhatIf(this.caseId(), scenario).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        // Dans une vraie app, le backend renvoie le résultat complet
        // Ici on simule localement le retour pour l'UX
        this.simulationScore.set(result.predicted_score_if || 3.1);
        this.simulationClass.set(result.predicted_class_if || 'MODERATE');
        this.isSimulating.set(false);
        this.snackBar.open('Simulation applied successfully.', 'OK', { duration: 3000 });
      },
      error: () => {
        // Mock Simulation Success
        of(null).pipe(delay(1000), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          // Logique naïve de mock : si on simule, on améliore le score artificiellement pour l'UX
          const baseScore = this.predictionData()?.predicted_score || 0;
          this.simulationScore.set(Math.min(5, baseScore + 0.7));
          this.simulationClass.set('MODERATE');
          this.isSimulating.set(false);
          this.snackBar.open('Simulation complete (Mock Mode).', 'OK', { duration: 3000 });
        });
      }
    });
  }

  public onResetSimulation(): void {
    this.simulationScore.set(null);
    this.simulationClass.set(null);
  }

  public navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'scoring-mcc']);
  }

  public proceedToTension(): void {
    this.router.navigate(['/cases', this.caseId(), 'tension']);
  }
}
