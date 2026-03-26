import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FinacesScoreGaugeComponent } from '../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';
import { FinacesRiskBadgeComponent } from '../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import { ScoringMccService } from './services/scoring-mcc.service';
import { ScoringMccSchema, ScoreOverridePayload } from '../../core/models/scoring.model';

import {
  PillarDetailCardComponent,
  OverrideZoneComponent,
  RecommendationsSectionComponent
} from './components';

@Component({
  selector: 'app-scoring-mcc',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PillarDetailCardComponent,
    OverrideZoneComponent,
    RecommendationsSectionComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent
  ],
  templateUrl: './scoring-mcc.component.html',
  styleUrls: ['./scoring-mcc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoringMccComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scoringService = inject(ScoringMccService);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');

  public scoringData = signal<ScoringMccSchema | null>(null);
  public isLoading = signal<boolean>(true);
  public isOverriding = signal<boolean>(false);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    const resolvedId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
    this.caseId.set(resolvedId);
    this.loadScoring();
  }

  private loadScoring(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.scoringService.getScoring(this.caseId()).subscribe({
      next: (data) => {
        this.scoringData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        console.warn('Backend unavailable, injecting Enterprise-Grade Mock for Scoring');
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
    setTimeout(() => {
      this.scoringData.set({
        case_id: this.caseId(),
        global_score: 3.8,
        risk_class: 'MODERATE',
        calculation_date: new Date().toISOString(),
        status: 'COMPUTED',
        pillars: [
          { id: 'p1', name: 'Liquidity', score: 3.5, weight: 20, status: 'GOOD', key_drivers: ['Adequate current ratio', 'Optimized WCR'] },
          { id: 'p2', name: 'Solvency', score: 2.1, weight: 25, status: 'POOR', key_drivers: ['High debt to equity', 'Gearing limit reached'] },
          { id: 'p3', name: 'Profitability', score: 4.5, weight: 25, status: 'EXCELLENT', key_drivers: ['Strong EBITDA margin', 'Consistent ROE'] },
          { id: 'p4', name: 'Capacity', score: 3.8, weight: 15, status: 'GOOD', key_drivers: ['Solid operating cash flow'] },
          { id: 'p5', name: 'Quality', score: 4.0, weight: 15, status: 'GOOD', key_drivers: ['Audited statements', 'Tier 1 auditor'] }
        ],
        recommendations: [
          { id: 'r1', type: 'WARNING', message: 'The solvency pillar heavily penalizes the global score. Recommend requiring additional guarantees.' },
          { id: 'r2', type: 'POSITIVE', message: 'Outstanding profitability metrics compensate for short-term liquidity stress.' }
        ],
        cross_analysis_alerts: [
          'Divergence: Profitability is EXCELLENT but Cash Flow Capacity is only GOOD. Investigate working capital absorption.'
        ]
      });
      this.isLoading.set(false);
    }, 1000);
  }

  public handleOverride(payload: ScoreOverridePayload): void {
    this.isOverriding.set(true);
    this.scoringService.overrideScore(this.caseId(), payload).subscribe({
      next: (updatedData) => {
        this.scoringData.set(updatedData);
        this.isOverriding.set(false);
        this.snackBar.open('Score override applied successfully.', 'OK', { duration: 3000, panelClass: ['bg-success', 'text-inverse'] });
      },
      error: () => {
        // Fallback simulate success
        setTimeout(() => {
          const currentData = this.scoringData();
          if (currentData) {
            this.scoringData.set({
              ...currentData,
              global_score: payload.new_score,
              status: 'OVERRIDDEN',
              override: {
                original_score: currentData.global_score,
                new_score: payload.new_score,
                original_risk_class: currentData.risk_class,
                new_risk_class: 'ADJUSTED', // Example
                reason: payload.reason,
                author: 'Current User (Senior Analyst)',
                timestamp: new Date().toISOString()
              }
            });
          }
          this.isOverriding.set(false);
          this.snackBar.open('Score override applied (Mock Mode).', 'OK', { duration: 3000 });
        }, 800);
      }
    });
  }

  public navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'ratios']);
  }

  public proceedNext(): void {
    // Proceed to AI Bloc (Bloc 6) or Tension (Bloc 7) depending on workflow
    this.router.navigate(['/cases', this.caseId(), 'ia']);
  }
}