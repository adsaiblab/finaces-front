import { NgClass } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
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
  RecommendationsSectionComponent,
} from './components';

@Component({
  selector: 'app-scoring-mcc',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PillarDetailCardComponent,
    OverrideZoneComponent,
    RecommendationsSectionComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent,
    NgClass,
  ],
  templateUrl: './scoring-mcc.component.html',
  styleUrls: ['./scoring-mcc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoringMccComponent {
  private readonly caseContext = inject(CaseContextService);
  private router = inject(Router);
  private scoringService = inject(ScoringMccService);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');
  private readonly destroyRef = inject(DestroyRef);

  public scoringData = signal<ScoringMccSchema | null>(null);
  public isLoading = signal<boolean>(true);
  public isOverriding = signal<boolean>(false);
  public error = signal<string | null>(null);

  readonly liquidityPillar = computed(
    () => this.scoringData()?.pillars.find((p) => p.name.toLowerCase().includes('liquid')) ?? null,
  );
  readonly solvencyPillar = computed(
    () => this.scoringData()?.pillars.find((p) => p.name.toLowerCase().includes('solven')) ?? null,
  );
  readonly profitabilityPillar = computed(
    () => this.scoringData()?.pillars.find((p) => p.name.toLowerCase().includes('profit')) ?? null,
  );
  readonly capacityPillar = computed(
    () => this.scoringData()?.pillars.find((p) => p.name.toLowerCase().includes('capaci')) ?? null,
  );
  readonly qualityPillar = computed(
    () => this.scoringData()?.pillars.find((p) => p.name.toLowerCase().includes('quality')) ?? null,
  );

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadScoring();
  }

  private loadScoring(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.scoringData.set(null);

    this.scoringService
      .getScoring(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.scoringData.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          const status = err?.status;
          if (status === 401 || status === 403) {
            this.isLoading.set(false);
            this.router.navigate(['/auth/login']);
            return;
          }
          // On any other error (500, network…): show error state, no mock
          this.error.set('Unable to load scoring data. Please try again.');
          this.scoringData.set(null);
          this.isLoading.set(false);
        },
      });
  }

  public handleOverride(payload: ScoreOverridePayload): void {
    this.isOverriding.set(true);
    this.scoringService
      .overrideScore(this.caseId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedData) => {
          this.scoringData.set(updatedData);
          this.isOverriding.set(false);
          this.snackBar.open('Score override applied successfully.', 'OK', {
            duration: 3000,
            panelClass: 'snack-success',
          });
        },
        error: () => {
          of(null)
            .pipe(delay(800), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
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
                    new_risk_class: 'ADJUSTED',
                    reason: payload.reason,
                    author: 'Current User (Senior Analyst)',
                    timestamp: new Date().toISOString(),
                  },
                });
              }
              this.isOverriding.set(false);
              this.snackBar.open('Score override applied (Mock Mode).', 'OK', { duration: 3000 });
            });
        },
      });
  }

  public navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'ratios']);
  }

  public proceedNext(): void {
    this.router.navigate(['/cases', this.caseId(), 'ia']);
  }
}
