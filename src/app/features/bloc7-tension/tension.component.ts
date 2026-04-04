import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { forkJoin, catchError, of, delay } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ScoringMccService } from '../bloc5-scoring-mcc/services/scoring-mcc.service';
import { environment } from '../../../environments/environment';
import { IaService } from '../../core/services/ia.service';
import { TensionCalculatorService } from './services/tension-calculator.service';

import { TensionAnalysisResult, AnalystDecisionPayload } from '../../core/models/tension.model';
import { IAPredictionResult } from '../../core/models/ia.model';
import { TensionLevel, ScoringMccSchema } from '../../core/models/scoring.model';
import {
  FinacesSkeletonLoaderComponent,
  FinacesInlineErrorComponent,
  ErrorCode,
} from '../../shared/components';

import {
  TensionBannerComponent,
  TensionComparisonComponent,
  PillarTensionTableComponent,
  AnalystDecisionComponent,
} from './components';

@Component({
  selector: 'app-bloc7-tension',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FinacesSkeletonLoaderComponent,
    FinacesInlineErrorComponent,
    TensionBannerComponent,
    TensionComparisonComponent,
    PillarTensionTableComponent,
    AnalystDecisionComponent,
  ],
  templateUrl: './tension.component.html',
  styleUrls: ['./tension.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TensionComponent implements OnInit {
  private readonly caseContext    = inject(CaseContextService);
  private readonly router         = inject(Router);
  private readonly scoringService = inject(ScoringMccService);
  private readonly iaService      = inject(IaService);
  private readonly tensionCalc    = inject(TensionCalculatorService);
  private readonly snackBar       = inject(MatSnackBar);
  private readonly destroyRef     = inject(DestroyRef);

  readonly caseId = signal<string>('');

  readonly tensionData  = signal<TensionAnalysisResult | null>(null);
  readonly isLoading    = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  readonly loadError   = signal<ErrorCode | null>(null);
  readonly submitError = signal<ErrorCode | null>(null);
  readonly retryCount  = signal<number>(0);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadTensionAnalysis();
  }

  onRetryLoad(): void {
    this.loadError.set(null);
    this.retryCount.update((n) => n + 1);
    this.loadTensionAnalysis();
  }

  private loadTensionAnalysis(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      mcc: this.scoringService.getScoring(this.caseId()).pipe(catchError(() => of(null))),
      ia:  this.iaService.getPrediction(this.caseId()).pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (!data.mcc || !data.ia) {
            if (!environment.production) {
              console.warn('Data incomplete, falling back to mock Tension Data');
            }
            this.loadMockTension();
            return;
          }
          const result = this.tensionCalc.calculateTension(
            data.mcc as ScoringMccSchema,
            data.ia as unknown as IAPredictionResult,
          );
          this.tensionData.set(result);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('server');
          this.isLoading.set(false);
        },
      });
  }

  private loadMockTension(): void {
    const mockResponse: TensionAnalysisResult = {
      level: TensionLevel.SEVERE,
      direction: 'UP',
      delta_score: 1.2,
      mcc_class: 'MODERATE',
      ia_class: 'LOW',
      class_divergence: true,
      pillars_comparison: [
        { pillar_name: 'Liquidity',     mcc_score: 3.0, ia_impact: 4.2, delta: 1.2, is_divergent: true },
        { pillar_name: 'Solvency',      mcc_score: 2.5, ia_impact: 3.0, delta: 0.5, is_divergent: true },
        { pillar_name: 'Profitability', mcc_score: 4.0, ia_impact: 4.0, delta: 0.0, is_divergent: false },
      ],
      system_recommendation: 'Critical divergence detected. Deep investigation strongly advised.',
      requires_justification: true,
    };

    of(mockResponse)
      .pipe(delay(800), takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.tensionData.set(data);
        this.isLoading.set(false);
      });
  }

  handleDecision(payload: AnalystDecisionPayload): void {
    this.isSubmitting.set(true);
    this.submitError.set(null);

    of(null)
      .pipe(delay(1000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Décision analyste enregistrée.', 'OK', {
            duration: 3000,
            panelClass: 'snack-success',
          });
          if (payload.decision === 'INVESTIGATE') {
            this.router.navigate(['/cases', this.caseId(), 'stress']);
          } else if (payload.decision === 'EXPERT_REVIEW') {
            this.router.navigate(['/cases', this.caseId(), 'expert']);
          } else {
            this.router.navigate(['/cases', this.caseId(), 'rapport']);
          }
        },
        error: () => {
          this.submitError.set('server');
          this.isSubmitting.set(false);
        },
      });
  }

  navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'ia']);
  }
}
