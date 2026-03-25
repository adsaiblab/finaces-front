import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
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
  AnalystDecisionComponent
} from './components';

@Component({
  selector: 'app-bloc7-tension',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TensionBannerComponent,
    TensionComparisonComponent,
    PillarTensionTableComponent,
    AnalystDecisionComponent
  ],
  templateUrl: './tension.component.html',
  styleUrls: ['./tension.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TensionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scoringService = inject(ScoringMccService);
  private iaService = inject(IaService);
  private tensionCalc = inject(TensionCalculatorService);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');

  public tensionData = signal<TensionAnalysisResult | null>(null);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    const resolvedId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
    this.caseId.set(resolvedId);
    this.loadTensionAnalysis();
  }

  private loadTensionAnalysis(): void {
    this.isLoading.set(true);

    forkJoin({
      mcc: this.scoringService.getScoring(this.caseId()).pipe(catchError(() => of(null))),
      ia: this.iaService.getPrediction(this.caseId()).pipe(catchError(() => of(null)))
    }).subscribe(data => {
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
    setTimeout(() => {
      this.tensionData.set({
        level: 'SEVERE' as any,
        direction: 'UP',
        delta_score: 1.2,
        mcc_class: 'MODERATE',
        ia_class: 'LOW',
        class_divergence: true,
        pillars_comparison: [
          { pillar_name: 'Liquidity', mcc_score: 3.0, ia_impact: 4.2, delta: 1.2, is_divergent: true },
          { pillar_name: 'Solvency', mcc_score: 2.5, ia_impact: 3.0, delta: 0.5, is_divergent: true },
          { pillar_name: 'Profitability', mcc_score: 4.0, ia_impact: 4.0, delta: 0, is_divergent: false }
        ],
        system_recommendation: 'Critical divergence detected. Deep investigation strongly advised.',
        requires_justification: true
      });
      this.isLoading.set(false);
    }, 800);
  }

  public handleDecision(payload: AnalystDecisionPayload): void {
    this.isSubmitting.set(true);
    // Simulation de la sauvegarde de la décision
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.snackBar.open('Analyst decision recorded successfully.', 'OK', { duration: 3000, panelClass: ['bg-success', 'text-white'] });

      // Si le user a choisi INVESTIGATE on l'envoie vers Stress Test (Bloc 8) ou Expert (Bloc 9).
      // Sinon on passe au Rapport (Bloc 10). On va l'envoyer au Bloc 8 pour le moment.
      this.router.navigate(['/cases', this.caseId(), 'stress-tests']);
    }, 1000);
  }

  public navigateBack(): void {
    // Retour vers IA
    this.router.navigate(['/cases', this.caseId(), 'ia-prediction']);
  }
}
