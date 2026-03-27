import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, catchError, of, delay } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ScoringMccService } from '../bloc5-scoring-mcc/services/scoring-mcc.service';
import { IaService } from '../../core/services/ia.service';
import { TensionCalculatorService } from './services/tension-calculator.service';

import { TensionAnalysisResult, AnalystDecisionPayload } from '../../core/models/tension.model';

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
    TensionBannerComponent,
    TensionComparisonComponent,
    PillarTensionTableComponent,
    AnalystDecisionComponent,
  ],
  templateUrl: './tension.component.html',
  styleUrls: ['./tension.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TensionComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scoringService = inject(ScoringMccService);
  private iaService = inject(IaService);
  private tensionCalc = inject(TensionCalculatorService);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');
  private readonly destroyRef = inject(DestroyRef);

  public tensionData = signal<TensionAnalysisResult | null>(null);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    const resolvedId =
      this.route.parent?.snapshot.paramMap.get('id') ||
      this.route.snapshot.paramMap.get('id') ||
      '';
    this.caseId.set(resolvedId);
    this.loadTensionAnalysis();
  }

  private loadTensionAnalysis(): void {
    this.isLoading.set(true);

    forkJoin({
      mcc: this.scoringService.getScoring(this.caseId()).pipe(catchError(() => of(null))),
      ia: this.iaService.getPrediction(this.caseId()).pipe(catchError(() => of(null))),
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      // Dans une vraie application, on vérifierait si MCC et IA sont dispos.
      // Pour le prototype, si ça échoue, on mock.
      if (!data.mcc || !data.ia) {
        console.warn('Data incomplete, falling back to mock Tension Data');
        this.loadMockTension();
        return;
      }

      const result = this.tensionCalc.calculateTension(data.mcc as any, data.ia);
      this.tensionData.set(result);
      this.isLoading.set(false);
    });
  }

  private loadMockTension(): void {
    const mockResponse = {
      level: 'SEVERE' as any,
      direction: 'UP',
      delta_score: 1.2,
      mcc_class: 'MODERATE',
      ia_class: 'LOW',
      class_divergence: true,
      pillars_comparison: [
        {
          pillar_name: 'Liquidity',
          mcc_score: 3.0,
          ia_impact: 4.2,
          delta: 1.2,
          is_divergent: true,
        },
        { pillar_name: 'Solvency', mcc_score: 2.5, ia_impact: 3.0, delta: 0.5, is_divergent: true },
        {
          pillar_name: 'Profitability',
          mcc_score: 4.0,
          ia_impact: 4.0,
          delta: 0,
          is_divergent: false,
        },
      ],
      system_recommendation: 'Critical divergence detected. Deep investigation strongly advised.',
      requires_justification: true,
    };

    of(mockResponse)
      .pipe(delay(800), takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.tensionData.set(data as any);
        this.isLoading.set(false);
      });
  }

  public handleDecision(payload: AnalystDecisionPayload): void {
    this.isSubmitting.set(true);
    // Simulation de la sauvegarde de la décision
    of(null).pipe(delay(1000), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isSubmitting.set(false);
      this.snackBar.open('Analyst decision recorded successfully.', 'OK', {
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
    });
  }

  public navigateBack(): void {
    // Retour vers IA
    this.router.navigate(['/cases', this.caseId(), 'ia']);
  }
}
